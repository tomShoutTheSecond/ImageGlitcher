import React, { CSSProperties, createRef } from 'react';
import { ImageLoader } from './ImageLoader';
import { ImageProcessorWindow, AmpModSettings } from './ImageProcessorWindow';
import { FramebankWindow } from './FramePreview';
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

    static addFrameToTransitionFrames(frame : Frame, transitionIndex : number)
    {
        let transitionFrames = this.app.state.transitionFrames;
        let transitionFramesIndex = transitionFrames[transitionIndex];
        transitionFramesIndex.push(frame);

        transitionFrames[transitionIndex] = transitionFramesIndex;

        this.app.setState({ transitionFrames: transitionFrames });
    }

    static addKeyFrame(frame : Frame)
    {
        let newKeyframes = this.app.state.keyframes;
        newKeyframes.push(frame);
        this.app.setState({ keyframes: newKeyframes });
    }

    static clearKeyframes()
    {
        this.app.state.keyframes.length = 0;
    }

    static inspectFrame(frame : Frame)
    {
        this.app.setState({ inspectedFrame: frame });
    }

    static needsLoadWarning()
    {
        return this.app.state.frames.length > 0 || this.app.state.keyframes.length;
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
    transitionFrames : Frame[][],
    inspectedFrame : Frame | null,
    animationUrl : string,
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

class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frames: [], keyframes: [], transitionFrames: [], inspectedFrame: null, animationUrl: "", frameIsLoading: false, animationIsLoading: false, encodingAlgorithm: "mulaw" };

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
                <AnimationPreview url={this.state.animationUrl} isLoading={this.state.animationIsLoading} />
                <div>
                    <FrameInspector frame={this.state.inspectedFrame} />
                    <FramebankWindow frames={this.state.frames} isLoading={this.state.frameIsLoading}/>
                </div>
                <Timeline imageData={this.state.imageData} keyframes={this.state.keyframes} encodingAlgorithm={this.state.encodingAlgorithm} />
            </div>
        );
    }
}

export default App;
