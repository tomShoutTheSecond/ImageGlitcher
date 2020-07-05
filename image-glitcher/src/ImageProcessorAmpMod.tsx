import { Util } from "./Util";
import { AmpModSettings } from "./ImageProcessorWindow";
import { State } from "./App";
import { FramebankWindow } from "./FramePreview";

export class ImageProcessorAmpMod
{
    static processAnimation(imageData : Uint8Array, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, boomerang : boolean, encodingAlgorithm : string)
    {
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
            let progress = i / frames;
            let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
            let framePhase = Util.mixNumber(startPhase, endPhase, progress);
            let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
            let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

            let settings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);

            this.processFrame(imageData, settings, encodingAlgorithm);
        }

        if(boomerang)
        {
            for (let i = 0; i < frames; i++) 
            {
                let progress = 1 - (i / frames);
                let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
                let framePhase = Util.mixNumber(startPhase, endPhase, progress);
                let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
                let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

                let settings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);

                this.processFrame(imageData, settings, encodingAlgorithm);
            }
        }

        State.setFrameLoadingState(false);

        //create animation (once image previews are loaded)
        let waitTime = 1000;
        setTimeout(() => FramebankWindow.instance?.createGif(), waitTime);
    }

    static processFrame(imageData : Uint8Array, settings : AmpModSettings, encodingAlgorithm : string)
    {
        //decode data
        let decodedFile = this.decodeFile(imageData, encodingAlgorithm);

        //process data
        let processedData = this.bufferProcess(decodedFile, settings);

        //encode data
        let encodedFile = this.encodeFile(processedData, encodingAlgorithm);
        
        this.saveByteArrayAsFrame(encodedFile, settings);
    }

    static encodeFile(rawData : number[], encodingAlgorithm : string)
    {
        //@ts-ignore
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.encode(rawData) : alawmulaw.alaw.encode(rawData);
    }

    static decodeFile(rawData : Uint8Array, encodingAlgorithm : string)
    {
        //@ts-ignore
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.decode(rawData) : alawmulaw.alaw.decode(rawData);
    }

    static bufferProcess(buffer : any, settings : AmpModSettings)
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

    static saveByteArrayAsFrame(data : any, settings : AmpModSettings)
    {
        let blob = new Blob([data], {type: "image/bmp"});
        let url = window.URL.createObjectURL(blob);

        State.addFrameToFramebank({ url: url, data: blob, ampModSettings: settings });
    }
}