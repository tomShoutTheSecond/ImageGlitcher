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

        let startFreq = firstFrameSettings.frequency;
        let endFreq = lastFrameSettings.frequency;
        let startPhase = firstFrameSettings.phase;
        let endPhase = lastFrameSettings.phase;
        let startAmp = firstFrameSettings.amp;
        let endAmp = lastFrameSettings.amp;
        let startOffset = firstFrameSettings.offset;
        let endOffset = lastFrameSettings.offset;

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

            let settings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);
            let newFrame = this.bufferProcess(decodedBuffer, settings);
            let encodedFrame = this.encodeFile(newFrame, encodingAlgorithm);
            renderedFrames.push({ frame: encodedFrame, settings: settings });

            postMessage({ id: "progress", progress: progress });
        }

        return renderedFrames;
    }

    bufferProcess(buffer, settings) //settings is AmpModSettings
    {
        let headerLength = 54; //value seems to work well for bitmap files

        let frequency = settings.frequency
        let phase = settings.phase;
        let amp = settings.amp;
        let offset = settings.offset;

        let processedBuffer = [];
        for (let i = 0; i < buffer.length; i++) 
        {
            const sample = buffer[i];

            if(i < headerLength)
            {
                processedBuffer.push(sample);
                continue;
            }

            let angle = phase + i * frequency;
            let coef = offset + Math.sin(angle) * amp;

            let processedSample = sample * coef;
            processedBuffer.push(processedSample);
        }

        return processedBuffer;
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

frameRenderer = new FrameRendererAmpMod();

onmessage = function(message) 
{
    if(message.data.id == "renderFrame")
    {
        let newFrame = frameRenderer.renderFrame(message.data.buffer, message.data.ampModSettings, message.data.encodingAlgorithm);
        postMessage({ id: message.data.id, output: newFrame });
    }
    else if(message.data.id == "renderAnimation")
    {
        let newFrames = frameRenderer.renderAnimation(message.data.buffer, message.data.frames, message.data.firstFrameSettings, message.data.lastFrameSettings, message.data.encodingAlgorithm, message.data.audioLink);
        postMessage({ id: message.data.id, output: newFrames });
    }
}