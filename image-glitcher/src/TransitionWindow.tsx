import React, { createRef } from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Frame, TransitionFramebank, State } from './App';
import { ImageProcessorAmpMod } from './ImageProcessorAmpMod';
import { settings } from 'cluster';

interface TransitionWindowProps 
{ 
    imageData : Uint8Array,
    keyframes : Frame[],
    transitionFrames : TransitionFramebank,
    encodingAlgorithm : "mulaw" | "alaw",
    index : number
}

export class TransitionWindow extends React.Component<TransitionWindowProps>
{
    framesInput = createRef<HTMLInputElement>();

    render()
    {
        let backgroundColor = Colors.background;
        switch(this.props.transitionFrames.status)
        {
            case "pending":
                backgroundColor = Colors.background;
                break;
            case "rendering":
                backgroundColor = Colors.rendering;
                break;
            case "complete":
                backgroundColor = Colors.complete;
                break;
        }

        let containerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: backgroundColor,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block"
        };

        let progressWidth = 192;
        let progressBarStyle : React.CSSProperties = 
        {
            outline: "1px solid black",
            width: progressWidth,
            height: "16px",
            marginBottom: "16px"
        };

        let progressBarInnerStyle : React.CSSProperties = 
        {
            visibility: this.props.transitionFrames.progress === 0 ? "hidden" : "visible",
            background: Colors.white,
            outline: "1px solid black",
            width: progressWidth * this.props.transitionFrames.progress,
            height: "16px"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Transition</h1>
                <p>{this.props.transitionFrames.status}</p>
                <div style={progressBarStyle}>
                    <div style={progressBarInnerStyle}/>
                </div>
                <label>Frames </label><input type="number" ref={this.framesInput}></input>
                <br/>
                <button onClick={() => this.renderFrames()} style={{ float: "right", marginTop: "16px" }}>Render</button>
            </div>
        );
    }

    renderFrames()
    {
        //clear previously rendered frames
        State.clearTransitionFramebank(this.props.index);

        let framesInput = this.framesInput.current as HTMLInputElement;
        let frames = parseInt(framesInput.value);

        let firstFrameSettings = this.props.keyframes[this.props.index].ampModSettings;
        let lastFrameSettings = this.props.keyframes[this.props.index + 1].ampModSettings;

        State.setTransitionRenderStatus(this.props.index, "rendering");

        setTimeout(() => 
        { 
            ImageProcessorAmpMod.instance.processAnimation(this.props.imageData, frames, firstFrameSettings, lastFrameSettings, this.props.encodingAlgorithm, this.props.index); 
        }, 100);
    }
}