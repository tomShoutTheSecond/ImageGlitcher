import React, { CSSProperties, createRef } from 'react';
import { ImageLoader } from './ImageLoader';
import { ImageProcessor, AmpModSettings } from './ImageProcessor';
import { FramePreview } from './FramePreview';
import { AnimationPreview } from './AnimationPreview';
import { Timeline } from './Timeline';
import { FrameInspector } from './FrameInspector';

export class State
{
    static app : App;

    static setImageData(imageData : Uint8Array)
    {
        this.app.setState({imageData: imageData});
    }

    static addFrame(frame : Frame)
    {
        let newFrames = this.app.state.frames;
        newFrames.push(frame);
        this.app.setState({ frames: newFrames });
    }

    static clearFrames()
    {
        this.app.state.frames.length = 0;
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

interface AppProps
{

}

interface AppState
{
    imageData : Uint8Array,
    frames : Frame[],
    keyframes : Frame[],
    inspectedFrame : Frame | null,
    animationUrl : string,
    frameIsLoading : boolean,
    animationIsLoading : boolean
}

export interface Frame
{
    url : string,
    data : Blob,
    ampModSettings : AmpModSettings
}

class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frames: [], keyframes: [], inspectedFrame: null, animationUrl: "", frameIsLoading: false, animationIsLoading: false};

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
                <ImageProcessor imageData={this.state.imageData} />
                <AnimationPreview url={this.state.animationUrl} isLoading={this.state.animationIsLoading} />
                <div>
                    <FrameInspector frame={this.state.inspectedFrame} />
                    <FramePreview frames={this.state.frames} isLoading={this.state.frameIsLoading}/>
                </div>
                <Timeline keyframes={this.state.keyframes}/>
            </div>
        );
    }
}

export default App;
