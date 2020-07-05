import React, { createRef } from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Frame } from './App';
import { ImageProcessorAmpMod } from './ImageProcessorAmpMod';
import { settings } from 'cluster';

interface TransitionWindowProps 
{ 
    imageData : Uint8Array,
    keyframes : Frame[],
    encodingAlgorithm : "mulaw" | "alaw",
    index : number
}

interface TransitionWindowState 
{
    status : "pending" | "rendering" | "complete"
}

export class TransitionWindow extends React.Component<TransitionWindowProps, TransitionWindowState>
{
    state : TransitionWindowState = { status: "pending" };

    framesInput = createRef<HTMLInputElement>();

    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: this.state.status === "complete" ? Colors.complete : Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Transition</h1>
                <p>{this.state.status}</p>
                <label>Frames </label><input type="number" ref={this.framesInput}></input>
                <br/>
                <button onClick={() => this.renderFrames()}>Render</button>
            </div>
        );
    }

    renderFrames()
    {
        let framesInput = this.framesInput.current as HTMLInputElement;
        let frames = parseInt(framesInput.value);

        let firstFrameSettings = this.props.keyframes[this.props.index].ampModSettings;
        let lastFrameSettings = this.props.keyframes[this.props.index + 1].ampModSettings;

        ImageProcessorAmpMod.processAnimation(this.props.imageData, frames, firstFrameSettings, lastFrameSettings, false, this.props.encodingAlgorithm);
    }
}