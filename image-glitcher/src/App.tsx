import React, { CSSProperties } from 'react';
import { ImageLoader } from './ImageLoader';
import { ImageProcessor } from './ImageProcessor';
import { FramePreview } from './FramePreview';
import { AnimationPreview } from './AnimationPreview';

export class State
{
    static app : App;

    static setImageData(imageData : Uint8Array)
    {
        this.app.setState({imageData: imageData});
    }

    static addDownload(url : string, data : Blob)
    {
        let newFrames = this.app.state.frameUrls;
        newFrames.push({ url: url, data: data });
        this.app.setState({ frameUrls: newFrames });
    }

    static clearDownloads()
    {
        this.app.state.frameUrls.length = 0;
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
    frameUrls : Frame[],
    animationUrl : string,
    frameIsLoading : boolean,
    animationIsLoading : boolean
}

export interface Frame
{
    url : string,
    data : Blob
}

class App extends React.Component<AppProps, AppState>
{
    state : AppState = { imageData: new Uint8Array(), frameUrls: [], animationUrl: "", frameIsLoading: false, animationIsLoading: false};

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
                <FramePreview frames={this.state.frameUrls} isLoading={this.state.frameIsLoading}/>
            </div>
        );
    }
}

export default App;
