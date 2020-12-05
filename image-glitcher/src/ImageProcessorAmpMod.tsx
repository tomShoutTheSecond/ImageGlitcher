import { Util } from "./Util";
import { State, KeyFrame as KeyFrame, TransitionFrame } from "./App";
import { AudioLink } from "./AudioLink";

export class DelaySettings
{
    delay = 0;
    feedback = 0;
    mix = 0;

    constructor(delay : number, feedback : number, mix : number)
    {
        this.delay = delay;
        this.feedback = feedback;
        this.mix = mix;
    }
}

export class AmpModSettings
{
    frequency = 0;
    phase = 0;
    amp = 0;
    offset = 0;

    constructor(frequency : number, phase : number, amp : number, offset : number)
    {
        this.frequency = frequency;
        this.phase = phase;
        this.amp = amp;
        this.offset = offset;
    }
}

export class ImageProcessorAmpMod
{
    static instance = new ImageProcessorAmpMod();

    frameRenderWorker = new Worker(Util.getPublicFile("frameRenderer.js"));

    processAnimation(imageData : Uint8Array, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, encodingAlgorithm : string, transitionIndex : number, audioLink : AudioLink)
    {
        this.backgroundRenderAnimation(imageData, frames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, transitionIndex, audioLink).then((processedData) => 
        { 
            //processedData is an array of { frame: buffer, settings: AmpModSettings }
            processedData.forEach((renderedFrame : { frame : Uint8Array, settings : AmpModSettings }) => 
            {
                this.saveTransitionFrame(renderedFrame.frame, renderedFrame.settings, transitionIndex);
            });

            //tell transition window that operation is complete
            State.setTransitionRenderStatus(transitionIndex, "complete");
        });
    }
    
    processKeyFrame(imageData : Uint8Array, settings : AmpModSettings, encodingAlgorithm : string)
    {
        this.backgroundRenderFrame(imageData, settings, encodingAlgorithm).then((processedData) => 
        { 
            this.saveKeyFrame(processedData, settings);
        });
    }

    processFrameSequence(imageData : Uint8Array[], settings : AmpModSettings, encodingAlgorithm : string)
    {
        let processNextSequenceFrame = (frameCounter : number) => 
        { 
            if(frameCounter > imageData.length - 1)
            {
                alert("framesequence rendered");
                return;
            }

            this.backgroundRenderFrame(imageData[frameCounter], settings, encodingAlgorithm).then((processedData) => 
            { 
                this.saveSequenceFrame(processedData);
                
                processNextSequenceFrame(frameCounter + 1);
            });
        };
        
        processNextSequenceFrame(0);
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

        this.processKeyFrame(imageData, settings, encodingAlgorithm);
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

    async backgroundRenderAnimation(buffer : any, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, encodingAlgorithm : string, transitionIndex : number, audioLink : AudioLink) : Promise<any>
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

            this.frameRenderWorker.postMessage({ id: "renderAnimation", buffer: buffer, frames: frames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, encodingAlgorithm: encodingAlgorithm, audioLink: audioLink });
        });
    }

    saveKeyFrame(data : any, settings : AmpModSettings)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        let url = URL.createObjectURL(blob);

        let frame = new KeyFrame(url, blob, settings);

        State.addFrameToFramebank(frame);
    }
    
    saveTransitionFrame(data : any, settings : AmpModSettings, transitionIndex : number)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        let frame = new TransitionFrame(blob, settings);

        State.addFrameToTransitionFrames(frame, transitionIndex);
    }

    saveSequenceFrame(data : any)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        //let frame = new TransitionFrame(blob, settings);

        console.log("new sequence frame processed")

        State.addProcessedSequenceFrame(blob);
    }
}