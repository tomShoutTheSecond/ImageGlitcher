import { Util } from "./Util";
import { State, KeyFrame as KeyFrame, TransitionFrame } from "./App";
import { AudioLink } from "./AudioLink";

export type ProcessorMode = "ampMod" | "delay" | "shuffle";

export class ImageProcessorSettings
{
    mode : ProcessorMode = "ampMod";
    ampModSettings = AmpModSettings.default;
    delaySettings = DelaySettings.default;
    shuffleSettings = ShuffleSettings.default;

    constructor(mode : ProcessorMode, ampModSettings : AmpModSettings, delaySettings : DelaySettings, shuffleSettings : ShuffleSettings)
    {
        this.mode = mode;
        this.ampModSettings = ampModSettings;
        this.delaySettings = delaySettings;
        this.shuffleSettings = shuffleSettings;
    }
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
            //processedData is an array of { frame: buffer, settings: ImageProcessorSettings }
            processedData.forEach((renderedFrame : { frame : Uint8Array, settings : ImageProcessorSettings }) => 
            {
                this.saveTransitionFrame(renderedFrame.frame, renderedFrame.settings, transitionIndex);
            });

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

    processFrameSequence(imageData : Uint8Array[], settings : ImageProcessorSettings, encodingAlgorithm : string)
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

    generateRandomFrame(imageData : Uint8Array, encodingAlgorithm : string, mode : ProcessorMode)
    {
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

        let settings = new ImageProcessorSettings(mode, ampModSettings, delaySettings, shuffleSettings);
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

    saveSequenceFrame(data : any)
    {
        let blob = new Blob([data], { type: "image/bmp" });
        //let frame = new TransitionFrame(blob, settings);

        console.log("new sequence frame processed")

        State.addProcessedSequenceFrame(blob);
    }
}