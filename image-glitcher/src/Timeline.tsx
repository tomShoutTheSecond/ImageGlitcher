import React, { createElement, createRef } from 'react';
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
    omitFrame : boolean,
    imageData : Uint8Array,
    encodingAlgorithm : "mulaw" | "alaw"
}

export class Timeline extends React.Component<TimelineProps>
{
    omitFrameCheckbox = createRef<HTMLInputElement>();

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
                    <input ref={this.omitFrameCheckbox} type="checkbox" onClick={() => this.changeOmitFramePreference()} checked /><label>Omit last frame (for smooth loops)</label>
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

        let imgElements = this.getImageElements();
        if(imgElements.length == 0)
        {
            alert("No transitions have been rendered!");
            return;
        }

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
                    let url = URL.createObjectURL(blob);
                    State.setAnimationUrl(url);
                    State.setAnimationLoadingState(false);
                });
                
                gif.render();
            }, pause);
        }

        let firstImage = imgElements[0] as HTMLImageElement;
        newImg.src = firstImage.src;
    }

    //puts each frame in an image element 
    getImageElements()
    {
        let allTransitionFrames : Frame[] = [];
        
        for (let i = 0; i < this.props.transitionFrames.length; i++) 
        {
            const transitionBank = this.props.transitionFrames[i];

            //cut off the last frame of each transition to avoid duplicates
            let framesToRemove = 1;
            if(i === this.props.transitionFrames.length - 1 && !this.props.omitFrame) //last transition, omit frame disabled
                framesToRemove = 0; //don't remove the frame
            let croppedTransitionFrames = transitionBank.frames.slice(0, transitionBank.frames.length - framesToRemove);

            //add to total frames
            allTransitionFrames = allTransitionFrames.concat(croppedTransitionFrames);
        }

        State.setAnimationLength(allTransitionFrames.length);

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
        for (let transitionIndex = 0; transitionIndex < this.props.transitionFrames.length; transitionIndex++) 
        {
            let transitionBank = this.props.transitionFrames[transitionIndex];
            
            for (let frameIndex = 0; frameIndex < transitionBank.frames.length; frameIndex++) 
            {
                //cut off the last frame of each transition to avoid duplicates

                let isLastFrameOfTransition = frameIndex === transitionBank.frames.length - 1;
                let isLastTransition = transitionIndex === this.props.transitionFrames.length - 1;
                let skipFrame = (isLastFrameOfTransition && !isLastTransition); //skip last frames of transitions (except the last transition)

                //omit last frame if requested
                if(isLastFrameOfTransition && isLastTransition && this.props.omitFrame)
                    skipFrame = true;

                if(skipFrame)
                    continue;

                const frame = transitionBank.frames[frameIndex];

                let leadingZeros = 4;
                zip.file(Util.getFrameName(String(frameIndex).padStart(leadingZeros, "0"), "transition" + String(transitionIndex).padStart(leadingZeros, "0") + "frame"), frame.data);
            }
        }

        zip.generateAsync({ type:"blob" }).then(function(content) 
        {
            //see FileSaver.js
            saveAs(content, "TimelineFrames.zip");
        });
    }

    changeOmitFramePreference()
    {
        let checkbox = this.omitFrameCheckbox.current;
        if(!checkbox) return;

        State.setOmitFramePreference(checkbox.checked);
    }

    isLastFrame(transitionIndex : number, frameIndex : number)
    {
        let lastTransition = transitionIndex === this.props.transitionFrames.length - 1;
        let lastFrame = frameIndex === this.props.transitionFrames[transitionIndex].frames.length - 1;

        return lastTransition && lastFrame;
    }
}
