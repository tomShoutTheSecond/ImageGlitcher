import React, { CSSProperties, createRef, Fragment } from 'react';
import { ImageLoader } from './ImageLoader';
import { ImageProcessorWindow, AmpModSettings } from './ImageProcessorWindow';
import { FramebankWindow } from './FramebankWindow';
import { AnimationPreview } from './AnimationPreview';
import { Timeline } from './Timeline';
import { FrameInspector } from './FrameInspector';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseController } from './DatabaseController';
import { AudioProcessorWindow } from './AudioProcessorWindow';
import { DSPTestBenchWindow } from './DSPTestBenchWindow';

export class State
{
    static app : App;

    static setEncodingAlgorithm(encodingAlgorithm : EncodingAlgorithm)
    {
        this.app.setState({ encodingAlgorithm: encodingAlgorithm });
    }

    static setImageData(imageData : Uint8Array)
    {
        this.app.setState({ imageData: imageData });
    }

    static addFrameToFramebank(frame : KeyFrame)
    {
        let newFrames = this.app.state.frames;
        newFrames.push(frame);
        this.app.setState({ frames: newFrames });
    }

    static clearFramebank()
    {
        this.app.state.frames.forEach(frame => frame.dispose());
        this.app.state.frames.length = 0;
    }

    static transitionFramesAreComplete()
    {
        let transitionFrames = this.app.state.transitionFrames;
        transitionFrames.forEach((transitionBank) => 
        { 
            if(transitionBank.status !== "complete")
                return false;
        });
        
        return true;
    }

    static clearAllTransitionFrames()
    {
        //delete transition frames from database 
        this.app.state.transitionFrames.forEach(transition => transition.clear());

        this.app.setState({ transitionFrames: [] });
    }

    static clearTransitionFramebank(transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionBank = transitionFrames[transitionIndex];
        transitionBank.clear();

        this.app.setState({ transitionFrames: transitionFrames });
    }
/*
    static addFrameToTransitionFrames(frame : KeyFrame, transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionBank = transitionFrames[transitionIndex];
        transitionBank.frames.push(frame);

        transitionFrames[transitionIndex] = transitionBank;

        this.app.setState({ transitionFrames: transitionFrames });
    }
*/
    static addFrameToTransitionFrames(frame : TransitionFrame, transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionBank = transitionFrames[transitionIndex];
        transitionBank.frames.push(frame);

        transitionFrames[transitionIndex] = transitionBank;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static setTransitionRenderStatus(transitionIndex : number, status : Status)
    {
        let transitionFrames = this.app.state.transitionFrames;
        transitionFrames[transitionIndex].status = status;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static setTransitionRenderProgress(transitionIndex : number, progress : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        transitionFrames[transitionIndex].progress = progress;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static addKeyFrame(frame : KeyFrame)
    {
        let newKeyframes = this.app.state.keyframes;
        newKeyframes.push(frame);

        //add empty transition framebank
        let transitionFrames = this.app.state.transitionFrames;
        if(newKeyframes.length > 1)
            transitionFrames.push(new TransitionFramebank());

        this.app.setState({ keyframes: newKeyframes, transitionFrames: transitionFrames });
    }

    static deleteKeyFrame(frame : KeyFrame)
    {
        //remove keyframe
        let newKeyframes = this.app.state.keyframes;
        let frameKeyframeIndex = newKeyframes.indexOf(frame);
        newKeyframes.splice(frameKeyframeIndex, 1);

        //remove transition framebank
        let transitionFrames = this.app.state.transitionFrames;
        transitionFrames.splice(frameKeyframeIndex, 1);

        this.app.setState({ keyframes: newKeyframes, transitionFrames: transitionFrames });
    }

    static clearKeyframes()
    {
        this.app.state.keyframes.length = 0;
    }

    static setOmitFramePreference(value : boolean)
    {
        this.app.setState({ omitFramePreference: value });
    }

    static inspectFrame(frame : KeyFrame)
    {
        this.app.setState({ inspectedFrame: frame });
    }

    static needsLoadWarning()
    {
        return this.app.state.frames.length > 0 || this.app.state.keyframes.length;
    }

    static setAnimationLength(frames : number)
    {
        this.app.setState({ animationLength : frames });
    }

    static setAnimationUrl(url : string)
    {
        URL.revokeObjectURL(this.app.state.animationUrl);
        
        this.app.setState({ animationUrl: url });
    }

    static setAnimationLoadingState(isLoading : boolean)
    {
        this.app.setState({ animationIsLoading: isLoading });
    }

    static setFramebankLoadingState(isLoading : boolean)
    {
        this.app.setState({ framebankIsLoading: isLoading });
    }

    static setAudioEnvelope(index : number, buffer : number[], fileName : string)
    {
        let audioBuffers = this.app.state.audioBuffers;
        audioBuffers[index] = buffer;

        this.app.setState({ audioBuffers: audioBuffers, audioSources: [ fileName ] });
    }

    static addAudioSource()
    {
        let buffers = this.app.state.audioBuffers;
        buffers.push([]);
        this.app.setState({ audioBuffers: buffers });

        console.log("buffers: ", this.app.state.audioBuffers);
    }

    //loads a frame to the animation sequence buffer (for applying effect to videos)
    static addFrameToSequence(frame : Uint8Array)
    {
        let frameSequence = this.app.state.frameSequence;
        frameSequence.push(frame);
        this.app.setState({ frameSequence: frameSequence });
    }

    static clearFrameSequence()
    {
        this.app.setState({ frameSequence: [] });
    }

    static addProcessedSequenceFrame(frame : Blob)
    {
        let processedFrameSequence = this.app.state.processedFrameSequence;
        processedFrameSequence.push(frame);
        this.app.setState({ processedFrameSequence: processedFrameSequence });
    }

    static clearProcessedFrameSequence()
    {
        this.app.setState({ processedFrameSequence: [] });
    }
}

interface AppProps { }

interface AppState
{
    imageData : Uint8Array,
    frames : KeyFrame[],
    keyframes : KeyFrame[],
    transitionFrames : TransitionFramebank[],
    omitFramePreference : boolean,
    inspectedFrame : KeyFrame | null,
    animationUrl : string,
    animationLength : number,
    framebankIsLoading : boolean,
    animationIsLoading : boolean,
    encodingAlgorithm : EncodingAlgorithm,
    audioBuffers : number[][],
    audioSources : string[],
    frameSequence : Uint8Array[],
    processedFrameSequence : Blob[]
}

export class KeyFrame
{
    id : string;
    url : string;
    data : Blob;
    ampModSettings : AmpModSettings;

    constructor(url : string, data : Blob, ampModSettings : AmpModSettings)
    {
        this.id = uuidv4();
        this.url = url;
        this.data = data;
        this.ampModSettings = ampModSettings;
    }

    dispose()
    {
        URL.revokeObjectURL(this.url);
    }
}

export class TransitionFrame
{
    id : string;
    ampModSettings : AmpModSettings;

    constructor(data : Blob, ampModSettings : AmpModSettings)
    {
        this.id = uuidv4();
        this.ampModSettings = ampModSettings;

        this.saveDataInDB(this.id, data);
    }

    dispose()
    {
        DatabaseController.delete(this.id);
    }

    saveDataInDB(id : string, data : Blob)
    {
        DatabaseController.add(id, data);
    }

    getDataAsync()
    {
        return DatabaseController.get(this.id);
    }
}

export type Status = "pending" | "rendering" | "complete";
export type EncodingAlgorithm = "mulaw" | "alaw";

export class TransitionFramebank
{
    status : Status = "pending";
    progress : number = 0;
    frames : TransitionFrame[] = [];

    clear()
    {
        //deletes frame from database
        this.frames.forEach(frame => { frame.dispose(); });

        this.frames = [];
    }
}

class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frames: [], keyframes: [], transitionFrames: [], omitFramePreference: true, inspectedFrame: null, animationUrl: "", animationLength: 0, framebankIsLoading: false, animationIsLoading: false, encodingAlgorithm: "mulaw", audioBuffers: [], audioSources: [], frameSequence: [], processedFrameSequence: [] };

    componentDidMount()
    {
        //provide App reference to State
        State.app = this;

        //initialize app
        this.init();
    }

    async init()
    {
        await DatabaseController.init();
    }

    render()
    {
        let containerStyle : CSSProperties = 
        {
            padding: "16px"
        }

        return (
            <div style={containerStyle}>
                <ImageLoader />
                <ImageProcessorWindow imageData={this.state.imageData} encodingAlgorithm={this.state.encodingAlgorithm}/>
                <AnimationPreview url={this.state.animationUrl} isLoading={this.state.animationIsLoading} animationLength={this.state.animationLength}/>
                <div>
                    <FrameInspector frame={this.state.inspectedFrame} imageData={this.state.imageData} encodingAlgorithm={this.state.encodingAlgorithm} frameSequence={this.state.frameSequence} processedFrameSequence={this.state.processedFrameSequence}/>
                    <FramebankWindow frames={this.state.frames} isLoading={this.state.framebankIsLoading}/>
                </div>
                <Timeline imageData={this.state.imageData} keyframes={this.state.keyframes} encodingAlgorithm={this.state.encodingAlgorithm} transitionFrames={this.state.transitionFrames} omitFrame={this.state.omitFramePreference} loadingGif={this.state.animationIsLoading} audioSources={this.state.audioSources} audioBuffers={this.state.audioBuffers}/>
            
                <AudioProcessorWindow buffers={this.state.audioBuffers} />
                <DSPTestBenchWindow />
            </div>
        );
    }
}

export default App;
