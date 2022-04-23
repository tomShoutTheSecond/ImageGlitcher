import React, { CSSProperties, createRef, Fragment } from 'react';
import { ImageLoaderWindow } from './ImageLoaderWindow';
import { ImageProcessorWindow } from './ImageProcessorWindow';
import { FramebankWindow } from './FramebankWindow';
import { AnimationPreviewWindow } from './AnimationPreviewWindow';
import { TimelineWindow } from './TimelineWindow';
import { FrameInspectorWindow } from './FrameInspectorWindow';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseController } from './DatabaseController';
import { AudioProcessorWindow } from './AudioProcessorWindow';
import { DSPTestBenchWindow } from './DSPTestBenchWindow';
import { ImageProcessorSettings } from './ImageProcessor';
import { Util } from './Util';
import { SequenceImportWindow } from './SequenceImportWindow';

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
        transitionFrames[transitionIndex].progress = 1;

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

    static moveKeyFrame(frame : KeyFrame, direction : "left" | "right")
    {
        let keyframes = this.app.state.keyframes;
        let keyframeIndex = keyframes.indexOf(frame);

        //reorder keyframes in timeline
        let newKeyframeIndex = direction === "left" ? keyframeIndex - 1 : keyframeIndex + 1;
        Util.arrayMove(keyframes, keyframeIndex, newKeyframeIndex);

        //assume all rendered transitions are no longer valid 
        //this could be improved to save rendering transitions that are still valid
        for(let transitionFramebank of this.app.state.transitionFrames)
        {
            transitionFramebank.clear();
            transitionFramebank.status = "pending";
            transitionFramebank.progress = 0;
        }

        this.app.setState({ keyframes: keyframes });
    }

    static clearKeyframes()
    {
        this.app.state.keyframes.length = 0;
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
        let audioSources = this.app.state.audioSources;
        audioBuffers[index] = buffer;
        audioSources[index] = fileName;

        this.app.setState({ audioBuffers: audioBuffers, audioSources: audioSources });
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
    settings : ImageProcessorSettings;

    constructor(url : string, data : Blob, settings : ImageProcessorSettings)
    {
        this.id = uuidv4();
        this.url = url;
        this.data = data;
        this.settings = settings;
    }

    dispose()
    {
        URL.revokeObjectURL(this.url);
    }
}

export class TransitionFrame
{
    id : string;
    settings : ImageProcessorSettings;

    constructor(data : Blob, settings : ImageProcessorSettings)
    {
        this.id = uuidv4();
        this.settings = settings;

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

//TODO: do some things
// x reuse split zip function from the old FrameInspector frame sequence download, to avoid memory overload when downloading timeline frames
// x figure out which frames should be omitted and share the logic between GIF maker and timeline download
// - calculate correct firstFrameIndex in TransitionWindow to enable rendering sequences of transitions in the timeline
// - add a dispose GIF animation button to free up some memory
// - add a memory watcher window with rolling stats
// - experiment with pixel sorting algorithms
//
class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frames: [], keyframes: [], transitionFrames: [], inspectedFrame: null, animationUrl: "", animationLength: 0, framebankIsLoading: false, animationIsLoading: false, encodingAlgorithm: "mulaw", audioBuffers: [], audioSources: [], frameSequence: [], processedFrameSequence: [] };

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
                <ImageLoaderWindow />
                <SequenceImportWindow frameSequence={this.state.frameSequence} processedFrameSequence={this.state.processedFrameSequence}/>
                <ImageProcessorWindow imageData={this.state.imageData} encodingAlgorithm={this.state.encodingAlgorithm}/>
                
                <div>
                    <FrameInspectorWindow frame={this.state.inspectedFrame} imageData={this.state.imageData} encodingAlgorithm={this.state.encodingAlgorithm}/>
                    <FramebankWindow frames={this.state.frames} isLoading={this.state.framebankIsLoading}/>
                </div>

                <TimelineWindow imageData={this.state.imageData} frameSequence={this.state.frameSequence} keyframes={this.state.keyframes} encodingAlgorithm={this.state.encodingAlgorithm} transitionFrames={this.state.transitionFrames} isLoadingGif={this.state.animationIsLoading} audioSources={this.state.audioSources} audioBuffers={this.state.audioBuffers}/>
                <AnimationPreviewWindow url={this.state.animationUrl} isLoading={this.state.animationIsLoading} animationLength={this.state.animationLength}/>
                <AudioProcessorWindow buffers={this.state.audioBuffers}/>
                <DSPTestBenchWindow />
            </div>
        );
    }
}

export default App;
