import React, { createRef } from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { KeyFrame, TransitionFramebank, State, EncodingAlgorithm } from './App';
import { ImageProcessorAmpMod } from './ImageProcessorAmpMod';
import { settings } from 'cluster';

interface TransitionWindowProps 
{ 
    imageData : Uint8Array,
    keyframes : KeyFrame[],
    transitionFrames : TransitionFramebank[],
    encodingAlgorithm : EncodingAlgorithm,
    index : number,
    audioSources : string[]
}

export class TransitionWindow extends React.Component<TransitionWindowProps>
{
    framesInput = createRef<HTMLInputElement>();

    render()
    {
        let thisTransition = this.props.transitionFrames[this.props.index];

        let backgroundColor = Colors.background;
        switch(thisTransition.status)
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
            visibility: thisTransition.progress === 0 ? "hidden" : "visible",
            background: Colors.white,
            outline: "1px solid black",
            width: progressWidth * thisTransition.progress,
            height: "16px"
        };

        let somethingIsRendering = false;
        this.props.transitionFrames.forEach((transition : TransitionFramebank) => 
        { 
            if(transition.status === "rendering")
                somethingIsRendering = true;
        });

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Transition</h1>
                <p>{thisTransition.status}</p>
                <div style={progressBarStyle}>
                    <div style={progressBarInnerStyle}/>
                </div>
                <label>Frames </label><input type="number" ref={this.framesInput}></input>
                <br/>

                <label htmlFor="audioSources">Audio source </label>
                <select name="audioSources" id="audioSources">
                    <option value="none">none</option>
                    {
                        this.props.audioSources.map((audioSource, key) => 
                        <option key={key} value={audioSource}>{audioSource}</option>)
                    }
                </select>
                <br/>
                <button onClick={() => this.renderFrames()} style={{ float: "right", marginTop: "16px" }} disabled={somethingIsRendering}>Render</button>
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