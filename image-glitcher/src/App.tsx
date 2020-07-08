import React, { CSSProperties, createRef } from 'react';
import { ImageLoader } from './ImageLoader';
import { ImageProcessorWindow, AmpModSettings } from './ImageProcessorWindow';
import { FramebankWindow } from './FramebankWindow';
import { AnimationPreview } from './AnimationPreview';
import { Timeline } from './Timeline';
import { FrameInspector } from './FrameInspector';

export class State
{
    static app : App;

    static setEncodingAlgorithm(encodingAlgorithm : "mulaw" | "alaw")
    {
        this.app.setState({ encodingAlgorithm: encodingAlgorithm });
    }

    static setImageData(imageData : Uint8Array)
    {
        this.app.setState({ imageData: imageData });
    }

    static addFrameToFramebank(frame : Frame)
    {
        let newFrames = this.app.state.frames;
        newFrames.push(frame);
        this.app.setState({ frames: newFrames });
    }

    static clearFramebank()
    {
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
        this.app.setState({ transitionFrames: [] });
    }

    static clearTransitionFramebank(transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionBank = transitionFrames[transitionIndex];
        transitionBank.clear();

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static addFrameToTransitionFrames(frame : Frame, transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionBank = transitionFrames[transitionIndex];
        transitionBank.frames.push(frame);

        transitionFrames[transitionIndex] = transitionBank;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static setTransitionFramebankStatus(transitionIndex : number, status : "pending" | "rendering" | "complete")
    {
        let transitionFrames = this.app.state.transitionFrames;
        transitionFrames[transitionIndex].status = status;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static addKeyFrame(frame : Frame)
    {
        let newKeyframes = this.app.state.keyframes;
        newKeyframes.push(frame);

        //add empty transition framebank
        let transitionFrames = this.app.state.transitionFrames;
        if(newKeyframes.length > 1)
            transitionFrames.push(new TransitionFramebank());

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

    static inspectFrame(frame : Frame)
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
        this.app.setState({ animationUrl: url });
    }

    static setAnimationLoadingState(isLoading : boolean)
    {
        this.app.setState({ animationIsLoading: isLoading });
    }

    static setFrameLoadingState(isLoading : boolean)
    {
        this.app.setState({ frameIsLoading: isLoading });
    }
}

interface AppProps { }

interface AppState
{
    imageData : Uint8Array,
    frames : Frame[],
    keyframes : Frame[],
    transitionFrames : TransitionFramebank[],
    omitFramePreference : boolean,
    inspectedFrame : Frame | null,
    animationUrl : string,
    animationLength : number,
    frameIsLoading : boolean,
    animationIsLoading : boolean,
    encodingAlgorithm : "mulaw" | "alaw";
}

export interface Frame
{
    url : string,
    data : Blob,
    ampModSettings : AmpModSettings
}

export class TransitionFramebank
{
    status : "pending" | "rendering" | "complete" = "pending";
    frames : Frame[] = [];

    clear()
    {
        this.frames = [];
    }
}

class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frames: [], keyframes: [], transitionFrames: [], omitFramePreference: true, inspectedFrame: null, animationUrl: "", animationLength: 0, frameIsLoading: false, animationIsLoading: false, encodingAlgorithm: "mulaw" };

    componentDidMount()
    {
        //provide App reference to State
        State.app = this;
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
                <ImageProcessorWindow imageData={this.state.imageData} encodingAlgorithm={this.state.encodingAlgorithm} />
                <AnimationPreview url={this.state.animationUrl} isLoading={this.state.animationIsLoading} animationLength={this.state.animationLength} />
                <div>
                    <FrameInspector frame={this.state.inspectedFrame} />
                    <FramebankWindow frames={this.state.frames} isLoading={this.state.frameIsLoading}/>
                </div>
                <Timeline imageData={this.state.imageData} keyframes={this.state.keyframes} encodingAlgorithm={this.state.encodingAlgorithm} transitionFrames={this.state.transitionFrames} omitFrame={this.state.omitFramePreference} />
            </div>
        );
    }
}

export default App;
