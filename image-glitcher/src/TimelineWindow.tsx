import React, { createElement, createRef } from 'react';
import { State, KeyFrame, TransitionFramebank, TransitionFrame, EncodingAlgorithm } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';
import { TransitionWindow } from './TransitionWindow';
import { IconButton } from './IconButton';
import Card from 'material-ui/Card/Card';

interface TimelineWindowProps
{
    imageData : Uint8Array,
    frameSequence : Uint8Array[],

    keyframes : KeyFrame[],
    transitionFrames : TransitionFramebank[],
    encodingAlgorithm : EncodingAlgorithm,
    isLoadingGif : boolean,
    audioSources : string[],
    audioBuffers : number[][]
}

interface TimelineWindowState
{
    isLoadingDownload : boolean
}

export class TimelineWindow extends React.Component<TimelineWindowProps, TimelineWindowState>
{
    omitFrameCheckbox = createRef<HTMLInputElement>();
    state = { isLoadingDownload: false }

    render()
    {
        let containerStyle = Styles.containerStyle;
        containerStyle.display = "block";

        return (
            <Card style={containerStyle}>
                <h1 style={Styles.h1Style}>Timeline</h1>
                {this.props.keyframes.map((keyframe, key) => 
                    <div key={key} style={Styles.inlineBlock}>
                        <FrameHolder frame={keyframe} frameIndex={key} context="timeline"/>
                        {key === this.props.keyframes.length - 1 ? "" : <TransitionWindow index={key} imageData={this.props.imageData} frameSequence={this.props.frameSequence} encodingAlgorithm={this.props.encodingAlgorithm} keyframes={this.props.keyframes} transitionFrames={this.props.transitionFrames} audioSources={this.props.audioSources} audioBuffers={this.props.audioBuffers}/>}
                    </div>
                )}
                <div style={Styles.bottomLeftMargin}>
                    <IconButton iconName="gif" hint="Generate GIF" loading={this.props.isLoadingGif} onClick={async () => await this.createGif()}/>
                    <IconButton leftMargin iconName="download" hint="Download frames" loading={this.state.isLoadingDownload} onClick={async () => await this.downloadFrames()}>Download Frames</IconButton>
                </div>
            </Card>
        );
    }

    async createGif()
    {
        //check if any transition frames are rendering, and cancel operation if so
        if(!State.transitionFramesAreComplete())
        {
            alert("Frames are still rendering!");
            return;
        }

        State.setAnimationLoadingState(true);

        let imgElements = await this.getImageElements();
        if(imgElements.length == 0)
        {
            State.setAnimationLoadingState(false);
            alert("No transitions have been rendered!");
            return;
        }

        console.log(`Creating GIF with ${imgElements.length} frames`);

        //first find the actual image size of the first frame
        var newImg = new Image();
        newImg.onload = () =>
        {
            //pause prevents black frames in the GIF
            let pause = 100;
            setTimeout(() => 
            {
                let width = newImg.width;
                let height = newImg.height;

                //@ts-ignore
                let gif = new GIF(
                {
                    workers: 2,
                    quality: 10,
                    width: width,
                    height: height
                });

                //add frames to gif
                imgElements.forEach(img => 
                {
                    gif.addFrame(img, { delay: 10 });
                });

                gif.on('finished', function(blob : Blob) 
                {
                    console.log("GIF finished");

                    //clean up virtual img elements to avoid memory leak
                    for (let i = 0; i < imgElements.length; i++) 
                    {
                        const img = imgElements[i];
                        URL.revokeObjectURL(img.src);
                        img.remove();
                    }

                    let url = URL.createObjectURL(blob);
                    State.setAnimationUrl(url);
                    State.setAnimationLoadingState(false);
                });
                
                gif.render();
            }, pause);
        }
        newImg.onerror = e => console.log("Error while loading GIF");

        let firstImage = imgElements[0] as HTMLImageElement;
        newImg.src = firstImage.src;
    }

    //puts each frame in an image element 
    async getImageElements()
    {
        let allTransitionFrames = await this.getAllTimelineFrames();
        State.setAnimationLength(allTransitionFrames.length);

        let imageElements : HTMLImageElement[] = [];
        for (let i = 0; i < allTransitionFrames.length; i++) 
        {
            const transitionFrame = allTransitionFrames[i];
            let frameData = await transitionFrame.getDataAsync();
            let frameUrl = URL.createObjectURL(frameData); 

            let imageElement = new Image();
            imageElement.src = frameUrl;
            imageElement.width = 20;
            imageElement.height = 20;

            imageElements.push(imageElement);
        }

        return imageElements;
    }

    async getAllTimelineFrames()
    {
        let allTransitionFrames : TransitionFrame[] = [];

        //loop through transitions
        for (let transitionBank of this.props.transitionFrames) 
        {
            //add to total frames
            allTransitionFrames = allTransitionFrames.concat(transitionBank.frames);
        }

        return allTransitionFrames;
    }

    async downloadFrames()
    {
        //check if any transition frames are rendering, and cancel operation if so
        if(!State.transitionFramesAreComplete())
        {
            alert("Frames are still rendering!");
            return;
        }

        this.setState({ isLoadingDownload: true });

        //add transition frames
        let allTransitionFrames = await this.getAllTimelineFrames();
        let blobs : Blob[] = [];

        for(let frame of allTransitionFrames)
        {
            let frameData = await frame.getDataAsync();
            blobs.push(frameData);
        }

        await Util.downloadFrameSequence(blobs);

        this.setState({ isLoadingDownload: false });
    }
}
