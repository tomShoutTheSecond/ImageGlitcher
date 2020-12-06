import React, { createRef } from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { KeyFrame, TransitionFramebank, State, EncodingAlgorithm } from './App';
import { ImageProcessor } from './ImageProcessor';
import { settings } from 'cluster';
import { AudioLink, ParameterType } from './AudioLink';

interface TransitionWindowProps 
{ 
    imageData : Uint8Array,
    keyframes : KeyFrame[],
    transitionFrames : TransitionFramebank[],
    encodingAlgorithm : EncodingAlgorithm,
    index : number,
    audioSources : string[],
    audioBuffers : number[][]
}

export class TransitionWindow extends React.Component<TransitionWindowProps>
{
    framesInput = createRef<HTMLInputElement>();
    audioSourceMenu = createRef<HTMLSelectElement>();
    audioParamMenu = createRef<HTMLSelectElement>();
    audioLinkAmountInput = createRef<HTMLInputElement>();
    audioLinkStartInput = createRef<HTMLInputElement>();
    audioLinkEndInput = createRef<HTMLInputElement>();

    parameterList = [ "none", "frequency", "phase", "amp", "offset" ];

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
                <br/><br/><br/>

                <label htmlFor="audioSources">Audio source </label>
                <select name="audioSources" id="audioSources" ref={this.audioSourceMenu}>
                    <option value="none">none</option>
                    {
                        this.props.audioSources.map((audioSource, key) => 
                        <option key={key} value={audioSource}>{audioSource}</option>)
                    }
                </select>
                <br/>

                <label>Start frame </label><input type="number" ref={this.audioLinkStartInput} defaultValue={0}></input>
                <br/>

                <label>End frame </label><input type="number" ref={this.audioLinkEndInput} defaultValue={0}></input>
                <br/>

                <label htmlFor="audioParam">Link parameter </label>
                <select name="audioParam" id="audioParam" ref={this.audioParamMenu}>
                    {
                        this.parameterList.map((parameter, key) => 
                        <option key={key} value={parameter}>{parameter}</option>)
                    }
                </select>
                <br/>

                <label>Link amount </label><input type="number" ref={this.audioLinkAmountInput} defaultValue={0}></input>
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

        let firstFrameSettings = this.props.keyframes[this.props.index].settings;
        let lastFrameSettings = this.props.keyframes[this.props.index + 1].settings;

        State.setTransitionRenderStatus(this.props.index, "rendering");

        let selectedAudioSourceIndex = this.audioSourceMenu.current?.selectedIndex;
        let audioLink : AudioLink = { audioBuffer: [], parameterType: "none", amount: 0 };

        if(selectedAudioSourceIndex != null && selectedAudioSourceIndex != 0)
        {
            let selectedAudioBuffer = this.props.audioBuffers[selectedAudioSourceIndex - 1];
            let audioBufferStart = (this.audioLinkStartInput.current as HTMLInputElement).valueAsNumber;
            let audioBufferEnd = (this.audioLinkEndInput.current as HTMLInputElement).valueAsNumber;
            if(audioBufferEnd == 0)
                audioBufferEnd = selectedAudioBuffer.length;

            audioLink.audioBuffer = selectedAudioBuffer.slice(audioBufferStart, audioBufferEnd);

            let selectedAudioLinkParameter = this.getAudioLinkParameterType(this.audioParamMenu.current?.selectedIndex);
            audioLink.parameterType = selectedAudioLinkParameter;

            let linkInput = this.audioLinkAmountInput.current as HTMLInputElement;
            audioLink.amount = linkInput.valueAsNumber;
        }

        setTimeout(() => 
        { 
            ImageProcessor.instance.processAnimation(this.props.imageData, frames, firstFrameSettings, lastFrameSettings, this.props.encodingAlgorithm, this.props.index, audioLink); 
        }, 100);
    }

    getAudioLinkParameterType(index : number | undefined) : ParameterType
    {
        if(index == undefined || index > this.parameterList.length - 1) return "none"; //error state, should never happen

        return this.parameterList[index] as ParameterType;
    }
}