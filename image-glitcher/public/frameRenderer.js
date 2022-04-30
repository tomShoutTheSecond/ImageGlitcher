self.importScripts('alawmulaw.js');

class FrameRenderer
{
    //render a single static frame with given settings
    renderFrame(imageData, settings, encodingAlgorithm)
    {
        let decodedBuffer = this.decodeFile(imageData, encodingAlgorithm);
        let processedFrame = this.bufferProcess(decodedBuffer, settings);
        let encodedBuffer = this.encodeFile(processedFrame, encodingAlgorithm);
        return encodedBuffer;
    }

    //this is a separate method from renderFrameOfTransition
    //because when rendering an animation from a single frame, we can just decode the imageData once 
    //but for rendering an animation from a frame sequence, we have to decode each frame individually
    renderSingleTransitionFrame(imageData, frameIndex, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink)
    {
        let decodedBuffer = this.decodeFile(imageData, encodingAlgorithm);
        return this.renderFrameOfTransition(decodedBuffer, frameIndex, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink);
    }

    //render one frame of a transition 
    renderFrameOfTransition(decodedBuffer, frameIndex, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink)
    {
        let settings = this.getInterpolatedSettings(frameIndex, totalFrames, firstFrameSettings, lastFrameSettings, interpolation, audioLink);
        console.log("Frame settings: ", settings);

        let newFrame = this.bufferProcess(decodedBuffer, settings);
        let encodedFrame = this.encodeFile(newFrame, encodingAlgorithm);
        return { frame: encodedFrame, settings: settings };
    }

    //gets the settings for a single transition frame
    getInterpolatedSettings(frameIndex, totalFrames, firstFrameSettings, lastFrameSettings, interpolation, audioLink)
    {
        //ampMod
        let startFreq = firstFrameSettings.ampModSettings.frequency;
        let endFreq = lastFrameSettings.ampModSettings.frequency;
        let startPhase = firstFrameSettings.ampModSettings.phase;
        let endPhase = lastFrameSettings.ampModSettings.phase;
        let startAmp = firstFrameSettings.ampModSettings.amp;
        let endAmp = lastFrameSettings.ampModSettings.amp;
        let startOffset = firstFrameSettings.ampModSettings.offset;
        let endOffset = lastFrameSettings.ampModSettings.offset;

        //delay
        let startDelay = firstFrameSettings.delaySettings.delay;
        let endDelay = lastFrameSettings.delaySettings.delay;
        let startFeedback = firstFrameSettings.delaySettings.feedback;
        let endFeedback = lastFrameSettings.delaySettings.feedback;
        let startMix = firstFrameSettings.delaySettings.mix;
        let endMix = lastFrameSettings.delaySettings.mix;

        //shuffle
        let startSegments = firstFrameSettings.shuffleSettings.segments;
        let endSegments = lastFrameSettings.shuffleSettings.segments;

        console.log("frameIndex: ", frameIndex);
        console.log("totalFrames: ", totalFrames);
        console.log("interpolation: ", interpolation);

        //here we use totalFrames + 1, to ensure that the lastFrameSettings are not quite reached
        //the first frame of the following transition will have lastFrameSettings, so to avoid duplciate frames
        //we ensure the last frame of this transition has different values so it smoothly flows into the next transition
        let progress = this.getAnimationProgress(frameIndex, totalFrames + 1, interpolation);

        console.log("Progress: ", progress);

        let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
        let framePhase = Util.mixNumber(startPhase, endPhase, progress);
        let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
        let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

        let frameDelay = Util.mixNumber(startDelay, endDelay, progress);
        let frameFeedback = Util.mixNumber(startFeedback, endFeedback, progress);
        let frameMix = Util.mixNumber(startMix, endMix, progress);

        let frameSegments = Util.mixNumber(startSegments, endSegments, progress);

        //TODO: test audio link for delay and shuffle
        //apply audio link parameter shift
        switch(audioLink.parameterType)
        {
            case "none":
                break;

            //ampMod
            case "frequency":
                frameFrequency += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            case "phase":
                framePhase += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            case "amp":
                frameAmp += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            case "offset":
                frameOffset += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            
            //delay
            case "delay":
                frameDelay += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            case "feedback":
                frameFeedback += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
            case "mix":
                frameMix += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;

            //shuffle
            case "segments":
                frameSegments += Util.getValueFromAudioLink(audioLink, frameIndex);
                break;
        }

        let ampModSettings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);
        let delaySettings = new DelaySettings(frameDelay, frameFeedback, frameMix);
        let shuffleSettings = new ShuffleSettings(frameSegments);
        let settings = { mode: firstFrameSettings.mode, ampModSettings: ampModSettings, delaySettings: delaySettings, shuffleSettings: shuffleSettings };

        return settings;
    }

    renderAnimation(imageData, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink)
    {
        let decodedBuffer = this.decodeFile(imageData, encodingAlgorithm);
        
        for (let i = 0; i < totalFrames; i++) 
        {
            let transitionFrame = this.renderFrameOfTransition(decodedBuffer, i, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink)

            let renderProgress = i / (totalFrames - 1);

            //send latest rendered frame back to main app
            //sending one frame at a time avoids out of memory error
            postMessage({ id: "progress", progress: renderProgress, renderedFrameBuffer: transitionFrame.frame, renderedFrameSettings: transitionFrame.settings });
        }
    }

    bufferProcess(buffer, settings)
    {
        let headerLength = 54; //value seems to work well for bitmap files

        if(settings.mode == "shuffle")
        {
            //skip the byte loop for shuffle effect; shuffle does not process one sample at a time

            let header = buffer.slice(0, headerLength);
            let unprocessedBuffer = buffer.slice(headerLength, buffer.length);
            let shuffledBuffer = this.bufferProcessShuffle(unprocessedBuffer, settings.shuffleSettings);

            return Util.joinArrays([header, shuffledBuffer]);
        }

        switch(settings.mode)
        {
            case "ampMod":
                break;
            case "delay":
                this.prepareToProcessDelay(settings.delaySettings);
                break;
        }

        let processedBuffer = [];
        for (let i = 0; i < buffer.length; i++) 
        {
            const sample = buffer[i];

            if(i < headerLength)
            {
                processedBuffer.push(sample);
                continue;
            }

            let processedSample = 0;
            switch(settings.mode)
            {
                case "ampMod":
                    processedSample = this.sampleProcessAmpMod(sample, i, settings.ampModSettings);
                    break;
                case "delay":
                    processedSample = this.sampleProcessDelay(sample, settings.delaySettings);
                    break;
            }

            processedBuffer.push(processedSample);
        }

        return processedBuffer;
    }

    sampleProcessAmpMod(sample, sampleIndex, ampModSettings)
    {
        let angle = ampModSettings.phase + sampleIndex * ampModSettings.frequency;
        let coef = ampModSettings.offset + Math.sin(angle) * ampModSettings.amp;

        //check if sample is in range
        let margin = 0.1;
        let target = 1;
        //if (sample > target - margin && sample < target + margin)
        if (sample <= -31100)
        {
            //ignore this sample
            return sample;
        }

        return sample * coef;
    }

    m_indexRead = 0;
    m_indexWrite = 0;
    m_delayBuffer = [];
    
    prepareToProcessDelay(delaySettings)
    {
        //set the circular buffer to fit the length of the delay exactly, fill it with zeros
        let bufferLength = Math.ceil(delaySettings.delay);
        this.m_delayBuffer = new Array(bufferLength).fill(0);
    }

    sampleProcessDelay(sampleToProcess, delaySettings)
    {
        //find theoretical read index (with decimal points)
        this.m_indexRead = this.m_indexWrite - delaySettings.delay;

        //wrap the read index to start of array if necessary
        if (this.m_indexRead < 0)
            this.m_indexRead += this.m_delayBuffer.length;

        //find two nearest indexes
        let m_indexRead1 = Math.floor(this.m_indexRead);

        //click remover part 1
        if (this.m_indexRead == this.m_delayBuffer.length)
        {
            m_indexRead1 -= 1;
        }

        let m_indexRead2 = m_indexRead1 + 1;
        if (m_indexRead2 >= this.m_delayBuffer.length)
            m_indexRead2 -= this.m_delayBuffer.length;

        let m_distanceWeighting = 0;

        //find distance weighting & click remover part 2
        if (this.m_indexRead == this.m_delayBuffer.length)
        {
            m_distanceWeighting = 1.0;
        }
        else
            m_distanceWeighting = this.m_indexRead % 1;

        //read the input, xn, from the incoming sample
        let xn = sampleToProcess;

        //read the output, yn, from the circular buffer at the read position
        let yn1 = this.m_delayBuffer[m_indexRead1];
        let yn2 = this.m_delayBuffer[m_indexRead2];

        let yn = yn2*m_distanceWeighting + yn1*(1 - m_distanceWeighting);

        //write the current input sample, plus some feedback of the output sample to m_sampleToWrite
        //write sample into the circular buffer at the write position
        let m_sampleToWrite = xn + yn*delaySettings.feedback;
        this.m_delayBuffer[this.m_indexWrite] = m_sampleToWrite;

        //increment the write index, wrapping the index back to the top of 
        //the circular buffer if necessary
        this.m_indexWrite++;
        if (this.m_indexWrite >= this.m_delayBuffer.length)
            this.m_indexWrite = 0;

        //set the incoming sample with the correct amounts of input and output
        //based on the wet/dry mix

        return delaySettings.mix*yn + (1.0 - delaySettings.mix)*xn;
    }

    bufferProcessShuffle(buffer, shuffleSettings)
    {
        let segments = shuffleSettings.segments;

        //choose (segments - 1) random indexes from the buffer
        let length = buffer.length;
        let markerPositions = [];
        for (let i = 0; i < segments - 1; i++)
        {
            markerPositions[i] = Util.getRandomInt(0, length);
        }

        //chop the buffer into segments

        let bufferSnippets = []; 

        //sort the markers by position (earliest marker goes first)
        markerPositions.sort((a, b) => a - b);

        //add start marker
        markerPositions.splice(0, 0, 0);

        //add end marker
        markerPositions.push(buffer.length);

        //chop the onions finely
        for (let i = 0; i < segments; i++)
        {
            let startMarkerIndex = markerPositions[i];
            let endMarkerIndex = markerPositions[i + 1];

            bufferSnippets[i] = buffer.slice(startMarkerIndex, endMarkerIndex);
        }

        //shuffle the segments
        bufferSnippets = Util.shuffle(bufferSnippets);
        let outputBuffer = Util.joinArrays(bufferSnippets);
        return outputBuffer;
    }

    getAnimationProgress(i, frames, interpolationExponent)
    {
        let x = i / (frames - 1);
        let y = Math.pow(x, interpolationExponent);
        return y;
    }

    printInterpolation()
    {
        console.log("test")
        let points = 20;
        let power = 0.5;
        for(let i = 0; i <= points; i++)
        {
            let x = i/points;
            let y = Math.pow(x, power);
            console.log("inter: " + y);
        }
    }

    encodeFile(rawData, encodingAlgorithm)
    {
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.encode(rawData) : alawmulaw.alaw.encode(rawData);
    }

    decodeFile(rawData, encodingAlgorithm)
    {
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.decode(rawData) : alawmulaw.alaw.decode(rawData);
    }
}

class Util
{
    static mixNumber(val0, val1, mix)
    {
        return val0 * (1 - mix) + val1 * mix;
    }

    static getValueFromAudioLink(audioLink, frameIndex)
    {
        if(audioLink.audioBuffer.length - 1 < frameIndex) return 0;

        return audioLink.amount * audioLink.audioBuffer[frameIndex];
    }

    static getRandomInt(min, max) 
    {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //takes an array of arrays, returns one array with all elements in order
    static joinArrays(arrays)
    {
        let outputArray = [];
        for(let i = 0; i < arrays.length; i++)
        {
            outputArray = outputArray.concat(Array.from(arrays[i]));//.concat(//.concat(arrays[i]);
        }

        return outputArray;
    }

    static shuffle(array) 
    {
        var currentIndex = array.length, temporaryValue, randomIndex;
      
        //while there remain elements to shuffle...
        while (0 !== currentIndex) 
        {
            //pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            //and swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
      
        return array;
    }
}

class AmpModSettings
{
    frequency = 0;
    phase = 0;
    amp = 0;
    offset = 0;

    constructor(frequency, phase, amp, offset)
    {
        this.frequency = frequency;
        this.phase = phase;
        this.amp = amp;
        this.offset = offset;
    }
}

class DelaySettings
{
    delay = 0;
    feedback = 0;
    mix = 0;

    constructor(delay, feedback, mix)
    {
        this.delay = delay;
        this.feedback = feedback;
        this.mix = mix;
    }
}

class ShuffleSettings
{
    segments = 0;

    constructor(segments)
    {
        this.segments = segments;
    }
}

class ImageProcessorSettings
{
    mode = "ampMod";
    interpolation = 1;
    ampModSettings = new AmpModSettings();
    delaySettings = new DelaySettings();
    shuffleSettings = new ShuffleSettings();
}

frameRenderer = new FrameRenderer();

onmessage = function(message) 
{
    if(message.data.id == "renderFrame")
    {
        let newFrame = frameRenderer.renderFrame(message.data.buffer, message.data.settings, message.data.encodingAlgorithm);
        postMessage({ id: message.data.id, output: newFrame });
    }
    else if(message.data.id == "renderAnimation")
    {
        frameRenderer.renderAnimation(message.data.buffer, message.data.frames, message.data.firstFrameSettings, message.data.lastFrameSettings, message.data.encodingAlgorithm, message.data.interpolation, message.data.audioLink);
        postMessage({ id: message.data.id });
    }
    else if(message.data.id == "renderOneTransitionFrame")
    {
        //{ id: "renderOneTransitionFrame", buffer: buffer, frameIndex: frameIndex, totalFrames: totalFrames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, encodingAlgorithm: encodingAlgorithm }
        let newFrame = frameRenderer.renderSingleTransitionFrame(message.data.buffer, message.data.frameIndex, message.data.totalFrames, message.data.firstFrameSettings, message.data.lastFrameSettings, message.data.encodingAlgorithm, message.data.interpolation, message.data.audioLink);
        postMessage({ id: message.data.id, output: newFrame });
    }
}

//TODO: make a simple database client for frameRenderer so it can read image data direct from the local db