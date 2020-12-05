import { AudioLink } from "./AudioLink";

export interface ImageProcessorInterface<SettingsType>
{
    frameRenderWorker : Worker;

    processAnimation(imageData : Uint8Array, frames : number, firstFrameSettings : SettingsType, lastFrameSettings : SettingsType, encodingAlgorithm : string, transitionIndex : number, audioLink : AudioLink) : void;

    processKeyFrame(imageData : Uint8Array, settings : SettingsType, encodingAlgorithm : string) : void;

    processFrameSequence(imageData : Uint8Array[], settings : AmpModSettings, encodingAlgorithm : string) : void;

    generateRandomFrame(imageData : Uint8Array, encodingAlgorithm : string) : void;

    backgroundRenderFrame(buffer : any, settings : AmpModSettings, encodingAlgorithm : string) : Promise<any>;

    backgroundRenderAnimation(buffer : any, frames : number, firstFrameSettings : AmpModSettings, lastFrameSettings : AmpModSettings, encodingAlgorithm : string, transitionIndex : number, audioLink : AudioLink) : Promise<any>;

    saveKeyFrame(data : any, settings : AmpModSettings) : void;

    saveTransitionFrame(data : any, settings : AmpModSettings, transitionIndex : number) : void;

    saveSequenceFrame(data : any) : void;
}