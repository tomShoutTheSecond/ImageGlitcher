import { Util } from "./Util";
import { State, KeyFrame as KeyFrame, TransitionFrame } from "./App";
import { AudioLink } from "./AudioLink";
//import { URL } from "url";

export type ProcessorMode = "ampMod" | "delay" | "shuffle";

export class ImageProcessorSettings
{
    mode : ProcessorMode = "ampMod";
    ampModSettings = AmpModSettings.default;
    delaySettings = DelaySettings.default;
    shuffleSettings = ShuffleSettings.default;
}

export class AmpModSettings
{
    static get default() { return { frequency: 0, phase: 0, amp: 0, offset: 0 } };

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

export class DelaySettings
{
    static get default() { return { delay: 0, feedback: 0, mix: 0 } };

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

export class ShuffleSettings
{
    static get default() { return { segments: 0 } };

    segments = 0;

    constructor(segments : number)
    {
        this.segments = segments;
    }
}

export class ImageProcessor
{
    static instance = new ImageProcessor();

    frameRenderWorker = new Worker(Util.getPublicFile("frameRenderer.js"));

    processAnimation(imageData : Uint8Array, frames : number, firstFrameSettings : ImageProcessorSettings, lastFrameSettings : ImageProcessorSettings, encodingAlgorithm : string, interpolation : number, transitionIndex : number, audioLink : AudioLink)
    {
        this.backgroundRenderAnimation(imageData, frames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, transitionIndex, audioLink).then((processedData) => 
        { 
            //tell transition window that operation is complete
            State.setTransitionRenderStatus(transitionIndex, "complete");
        });
    }
    
    processKeyFrame(imageData : Uint8Array, settings : ImageProcessorSettings, encodingAlgorithm : string)
    {
        this.backgroundRenderFrame(imageData, settings, encodingAlgorithm).then((processedData) => 
        { 
            this.saveKeyFrame(processedData, settings);
        });
    }

    async processFrameSequence(imageData : Uint8Array[], totalFrames : number, firstFrameSettings : ImageProcessorSettings, lastFrameSettings : ImageProcessorSettings, encodingAlgorithm : string, interpolation : number, transitionIndex : number, audioLink : AudioLink, counterCallback: (count: number) => void) : Promise<boolean>
    {
        return new Promise((resolve, reject) => 
        {
            let processNextSequenceFrame = (frameCounter : number) => 
            { 
                counterCallback(frameCounter);

                if(frameCounter == totalFrames)
                {
                    resolve(true);
                    return;
                }

                //enable frame sequence to be looped if it's not long enough for the transition
                let imageDataIndex = frameCounter;
                while(imageDataIndex > imageData.length - 1)
                    imageDataIndex -= imageData.length;

                this.backgroundRenderTransitionFrame(imageData[imageDataIndex], frameCounter, totalFrames, firstFrameSettings, lastFrameSettings, encodingAlgorithm, interpolation, audioLink)
                    .then((processedData : { frame : Uint8Array, settings : ImageProcessorSettings }) => 
                { 
                    this.saveTransitionFrame(processedData.frame, processedData.settings, transitionIndex);
                    
                    processNextSequenceFrame(frameCounter + 1);
                });
            };
            
            processNextSequenceFrame(0);    
        });
    }

    generateRandomFrame(imageData : Uint8Array, encodingAlgorithm : string, mode : ProcessorMode)
    {
        if(imageData.length == 0)
        {
            alert("No source image loaded");
            return;
        }

        let ampModSettings = AmpModSettings.default;
        let delaySettings = DelaySettings.default;
        let shuffleSettings = ShuffleSettings.default;

        switch(mode)
        {
            case "ampMod":
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

                ampModSettings = new AmpModSettings(randomFreq, Util.mixNumber(minPhase, maxPhase, Math.random()), randomAmp, randomOffset);

                break;

            case "delay":

                let randomDelay = Math.random() * 100000;//44100;
                let randomFeedback = Math.random() * 1.2;
                let randomMix = 0.9 + Math.random() * 0.1;

                delaySettings = new DelaySettings(randomDelay, randomFeedback, randomMix);

                break;
            
            case "shuffle":

                let minSegments = 2;
                let maxSegments = 100;
                let segments = Math.round(Util.mixNumber(minSegments, maxSegments, Math.random()));
                shuffleSettings = new ShuffleSettings(segments);

                break;
        }

        let settings = new ImageProcessorSettings();
        settings.mode = mode;
        settings.ampModSettings = ampModSettings;
        settings.delaySettings = delaySettings;
        settings.shuffleSettings = shuffleSettings;

        this.processKeyFrame(imageData, settings, encodingAlgorithm);
    }

    async backgroundRenderFrame(buffer : any, settings : ImageProcessorSettings, encodingAlgorithm : string) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.frameRenderWorker.onmessage = (message) => 
            {
                resolve(message.data.output);
            }

            this.frameRenderWorker.postMessage({ id: "renderFrame", buffer: buffer, settings: settings, encodingAlgorithm: encodingAlgorithm });
        });
    }

    //render one frame of a transition (used for rendering frame sequence transitions)
    async backgroundRenderTransitionFrame(buffer : any, frameIndex : number, totalFrames : number, firstFrameSettings : ImageProcessorSettings, lastFrameSettings : ImageProcessorSettings, encodingAlgorithm : string, interpolation: number, audioLink : AudioLink) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.frameRenderWorker.onmessage = (message) => 
            {
                //returns an object like this: { frame: encodedFrame, settings: settings }
                resolve(message.data.output);
            }

            this.frameRenderWorker.postMessage({ id: "renderOneTransitionFrame", buffer: buffer, frameIndex: frameIndex, totalFrames: totalFrames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, encodingAlgorithm: encodingAlgorithm, interpolation: interpolation, audioLink: audioLink });
        });
    }

    async backgroundRenderAnimation(buffer : any, frames : number, firstFrameSettings : ImageProcessorSettings, lastFrameSettings : ImageProcessorSettings, encodingAlgorithm : string, interpolation : number, transitionIndex : number, audioLink : AudioLink) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.frameRenderWorker.onmessage = (message) => 
            {
                if(message.data.id == "renderAnimation")
                    resolve(message.data.output);
                else if(message.data.id == "progress")
                {
                    this.saveTransitionFrame(message.data.renderedFrameBuffer, message.data.renderedFrameSettings, transitionIndex);

                    State.setTransitionRenderProgress(transitionIndex, message.data.progress);
                }
            }

            this.frameRenderWorker.postMessage({ id: "renderAnimation", buffer: buffer, frames: frames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, encodingAlgorithm: encodingAlgorithm, interpolation: interpolation, audioLink: audioLink });
        });
    }

    saveKeyFrame(data : any, settings : ImageProcessorSettings)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        let url = URL.createObjectURL(blob);

        let frame = new KeyFrame(url, blob, settings);

        State.addFrameToFramebank(frame);
    }
    
    saveTransitionFrame(data : any, settings : ImageProcessorSettings, transitionIndex : number)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        let frame = new TransitionFrame(blob, settings);

        State.addFrameToTransitionFrames(frame, transitionIndex);
    }
/*
    saveSequenceFrame(data : any)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        //let frame = new TransitionFrame(blob, settings);

        console.log("new sequence frame processed")

        State.addProcessedSequenceFrame(blob);
    }
    */
}