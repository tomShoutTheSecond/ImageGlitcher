self.importScripts('alawmulaw.js');

class FrameRendererAmpMod
{
    renderFrame(imageData, settings, encodingAlgorithm)
    {
        let decodedBuffer = this.decodeFile(imageData, encodingAlgorithm);
        let processedFrame = this.bufferProcess(decodedBuffer, settings);
        let encodedBuffer = this.encodeFile(processedFrame, encodingAlgorithm);

        return encodedBuffer;
    }

    renderAnimation(imageData, frames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, audioLink)
    {
        let decodedBuffer = this.decodeFile(imageData, encodingAlgorithm);
        let renderedFrames = [];

        let startFreq = firstFrameSettings.ampModSettings.frequency;
        let endFreq = lastFrameSettings.ampModSettings.frequency;
        let startPhase = firstFrameSettings.ampModSettings.phase;
        let endPhase = lastFrameSettings.ampModSettings.phase;
        let startAmp = firstFrameSettings.ampModSettings.amp;
        let endAmp = lastFrameSettings.ampModSettings.amp;
        let startOffset = firstFrameSettings.ampModSettings.offset;
        let endOffset = lastFrameSettings.ampModSettings.offset;

        console.log("startOffset", startOffset)

        for (let i = 0; i < frames; i++) 
        {
            let progress = i / (frames - 1);
            if(frames == 1) 
            {
                //avoid progress = NaN when only one frame is requested
                progress = 1;
            }
                
            let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
            let framePhase = Util.mixNumber(startPhase, endPhase, progress);
            let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
            let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

            //apply audio link parameter shift
            switch(audioLink.parameterType)
            {
                case "none":
                    break;
                case "frequency":
                    frameFrequency += Util.getValueFromAudioLink(audioLink, i);
                    break;
                case "phase":
                    framePhase += Util.getValueFromAudioLink(audioLink, i);
                    break;
                case "amp":
                    frameAmp += Util.getValueFromAudioLink(audioLink, i);
                    break;
                case "offset":
                    frameOffset += Util.getValueFromAudioLink(audioLink, i);
                    break;
            }

            let ampModSettings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);
            let settings = { mode: "ampMod", ampModSettings: ampModSettings };
            console.log("settings", settings)
            let newFrame = this.bufferProcess(decodedBuffer, settings);
            let encodedFrame = this.encodeFile(newFrame, encodingAlgorithm);
            renderedFrames.push({ frame: encodedFrame, settings: ampModSettings });

            postMessage({ id: "progress", progress: progress });
        }

        return renderedFrames;
    }

    bufferProcess(buffer, settings) //settings is AmpModSettings
    {
        switch(settings.mode)
        {
            case "ampMod":
                break;
            case "delay":
                this.prepareToProcessDelay(settings.delaySettings);
                break;
        }

        let headerLength = 54; //value seems to work well for bitmap files

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

class ImageProcessorSettings
{
    mode = "ampMod";
    ampModSettings = new AmpModSettings();
    delaySettings = new DelaySettings();
}

frameRenderer = new FrameRendererAmpMod();

onmessage = function(message) 
{
    if(message.data.id == "renderFrame")
    {
        let newFrame = frameRenderer.renderFrame(message.data.buffer, message.data.settings, message.data.encodingAlgorithm);
        postMessage({ id: message.data.id, output: newFrame });
    }
    else if(message.data.id == "renderAnimation")
    {
        let newFrames = frameRenderer.renderAnimation(message.data.buffer, message.data.frames, message.data.firstFrameSettings, message.data.lastFrameSettings, message.data.encodingAlgorithm, message.data.audioLink);
        postMessage({ id: message.data.id, output: newFrames });
    }
}