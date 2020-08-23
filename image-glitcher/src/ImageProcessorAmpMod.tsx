import { Util } from "./Util";
import { AmpModSettings } from "./ImageProcessorWindow";
import { State } from "./App";
import { FramebankWindow } from "./FramebankWindow";

export class ImageProcessorAmpMod
{
    static instance : ImageProcessorAmpMod = new ImageProcessorAmpMod();

    frameRenderWorker = new Worker(Util.getPublicFile("frameRenderer.js"));

    processAnimation(imageData : Uint8Array, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, encodingAlgorithm : string, transitionIndex : number)
    {
        this.backgroundRenderAnimation(imageData, frames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, transitionIndex).then((processedData) => 
        { 
            //processedData is an array of { frame: buffer, settings: AmpModSettings }
            processedData.forEach((renderedFrame : { frame : Uint8Array, settings : AmpModSettings }) => 
            {
                this.saveByteArrayAsFrame(renderedFrame.frame, renderedFrame.settings, transitionIndex);
            });

            //tell transition window that operation is complete
            State.setTransitionRenderStatus(transitionIndex, "complete");
        });
    }
    
    processFrame(imageData : Uint8Array, settings : AmpModSettings, encodingAlgorithm : string, transitionIndex ?: number)
    {
        this.backgroundRenderFrame(imageData, settings, encodingAlgorithm).then((processedData) => 
        { 
            this.saveByteArrayAsFrame(processedData, settings, transitionIndex);
        });
    }

    generateRandomFrame(imageData : Uint8Array, encodingAlgorithm : string)
    {
        //randomise frequency so each order of magnitude is equally likely
        let maxFreqMagnitude = 5;
        let randomFreqMagnitude = Math.floor(maxFreqMagnitude * Math.random());
        let randomFreq = 0.1 * Math.random();
        for(let i = 0; i < randomFreqMagnitude; i++)
        {
            randomFreq *= 0.1;
        }

        let minPhase = 0;
        let maxPhase = 20;

        let randomAmp = 1 * Math.random();
        let maxAmpMagnitude = 5;
        let randomAmpMagnitude = Math.floor(maxAmpMagnitude * Math.random());
        for(let i = 0; i < randomAmpMagnitude; i++)
        {
            randomAmp *= 2;
        }

        if(Math.random() > 0.5) //50% chance
            randomAmp = 0 - randomAmp;
        
        if(Math.random() < 0.1) //10% chance
            randomAmp = 0;

        let minOffset = -10;
        let maxOffset = 10;
        let randomOffset = Util.mixNumber(minOffset, maxOffset, Math.random());
        if(Math.random() < 0.2 && randomAmp != 0) //20% chance, make sure amp and offset are not both zero (or it makes a blank white frame)
            randomOffset = 0;

        let settings : AmpModSettings = 
        {
            frequency: randomFreq,
            phase : Util.mixNumber(minPhase, maxPhase, Math.random()),
            amp : randomAmp,
            offset : randomOffset
        }

        this.processFrame(imageData, settings, encodingAlgorithm);
    }

    async backgroundRenderFrame(buffer : any, settings : AmpModSettings, encodingAlgorithm : string) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.frameRenderWorker.onmessage = (message) => 
            {
                resolve(message.data.output);
            }

            this.frameRenderWorker.postMessage({ id: "renderFrame", buffer: buffer, ampModSettings: settings, encodingAlgorithm: encodingAlgorithm });
        });
    }

    async backgroundRenderAnimation(buffer : any, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, encodingAlgorithm : string, transitionIndex : number) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.frameRenderWorker.onmessage = (message) => 
            {
                if(message.data.id == "renderAnimation")
                    resolve(message.data.output);
                else if(message.data.id == "progress")
                {
                    State.setTransitionRenderProgress(transitionIndex, message.data.progress);
                }
            }

            this.frameRenderWorker.postMessage({ id: "renderAnimation", buffer: buffer, frames: frames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, encodingAlgorithm: encodingAlgorithm });
        });
    }

    saveByteArrayAsFrame(data : any, settings : AmpModSettings, transitionIndex ?: number)
    {
        let blob = new Blob([data], {type: "image/bmp"});
        let url = window.URL.createObjectURL(blob);

        let frame = { url: url, data: blob, ampModSettings: settings };

        if(transitionIndex == null)
            State.addFrameToFramebank(frame);
        else 
            State.addFrameToTransitionFrames(frame, transitionIndex);
    }
}