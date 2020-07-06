import React, { createElement } from 'react';
import { State, Frame, TransitionFramebank } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';
import { TransitionWindow } from './TransitionWindow';

interface TimelineProps
{
    keyframes : Frame[],
    transitionFrames : TransitionFramebank[],
    imageData : Uint8Array,
    encodingAlgorithm : "mulaw" | "alaw"
}

export class Timeline extends React.Component<TimelineProps>
{
    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Timeline</h1>
                {this.props.keyframes.map((keyframe, key) => 
                    <div key={key} style={Styles.inlineBlock}>
                        <FrameHolder frame={keyframe} frameIndex={key} />
                        {key == this.props.keyframes.length - 1 ? "" : <TransitionWindow index={key} imageData={this.props.imageData} encodingAlgorithm={this.props.encodingAlgorithm} keyframes={this.props.keyframes} transitionFrames={this.props.transitionFrames[key]}/>}
                    </div>
                )}
                <div>
                    <button onClick={() => this.createGif()}>Convert to GIF</button>
                    <button onClick={() => this.downloadFrames()}>Download Frames</button>
                </div>
            </div>
        );
    }

    createGif()
    {
        //check if any transition frames are rendering, and cancel operation if so
        if(!State.transitionFramesAreComplete())
        {
            alert("Frames are still rendering!");
            return;
        }

        State.setAnimationLoadingState(true);

        //first find the actual image size of the first frame
        var newImg = new Image();
        newImg.onload = () =>
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
            let imgElements = this.getImageElements();
            imgElements.forEach(img => 
            {
                gif.addFrame(img, {delay: 10});
            });
            
            gif.on('finished', function(blob : Blob) 
            {
                let url = URL.createObjectURL(blob);
                State.setAnimationUrl(url);
                State.setAnimationLoadingState(false);
            });
            
            gif.render();
        }

        //this.getImageElements();

        let firstImage = this.getImageElements()[0] as HTMLImageElement;
        newImg.src = firstImage.src;
    }

    //puts each frame in an image element 
    getImageElements()
    {
        let allTransitionFrames : Frame[] = [];
        this.props.transitionFrames.forEach((transitionBank) => 
        {
            allTransitionFrames = allTransitionFrames.concat(transitionBank.frames);
        });

        let imageElements : HTMLImageElement[] = [];
        allTransitionFrames.forEach((transitionFrame) => 
        {
            let imageElement = new Image();
            imageElement.src = transitionFrame.url;
            imageElement.width = 20;
            imageElement.height = 20;

            imageElements.push(imageElement);
        });

        return imageElements;
    }

    downloadFrames()
    {
        //check if any transition frames are rendering, and cancel operation if so
        if(!State.transitionFramesAreComplete())
        {
            alert("Frames are still rendering!");
            return;
        }

        let zip = new JSZip();

        //add transition frames
        for (let i = 0; i < this.props.transitionFrames.length; i++) 
        {
            let transitionBank = this.props.transitionFrames[i];
            
            for (let j = 0; j < transitionBank.frames.length; j++) 
            {
                const frame = transitionBank.frames[j];
                let leadingZeros = 3;
                zip.file(Util.getFrameName(String(j).padStart(leadingZeros, "0"), "transition" + String(j).padStart(leadingZeros, "0") + "frame"), frame.data);
            }
        }

        zip.generateAsync({ type:"blob" }).then(function(content) 
        {
            //see FileSaver.js
            saveAs(content, "TimelineFrames.zip");
        });
    }
}
