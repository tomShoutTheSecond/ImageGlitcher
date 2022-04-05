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

interface TransitionWindowState
{
    interpolationMode : InterpolationMode,
    audioLinkEnabled : boolean
}

type InterpolationMode = "linear" | "speedUp" | "slowDown";

export class TransitionWindow extends React.Component<TransitionWindowProps, TransitionWindowState>
{
    framesInput = createRef<HTMLInputElement>();
    audioSourceMenu = createRef<HTMLSelectElement>();
    audioParamMenu = createRef<HTMLSelectElement>();
    audioLinkAmountInput = createRef<HTMLInputElement>();
    audioLinkStartInput = createRef<HTMLInputElement>();
    audioLinkEndInput = createRef<HTMLInputElement>();
    interpolationInput = createRef<HTMLInputElement>();

    parameterList = [ "none", "frequency", "phase", "amp", "offset" ];

    state : TransitionWindowState = { interpolationMode : "linear", audioLinkEnabled : false };

    render()
    {
        let thisTransition = this.props.transitionFrames[this.props.index];

        let backgroundColor = Colors.fill;
        switch(thisTransition.status)
        {
            case "pending":
                backgroundColor = Colors.fill;
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
            margin: "0 16px 16px 16px",
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
            background: Colors.background,
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
                <label>Interpolation </label>
                <select name="interpolationMode" id="interpolationMode" ref={this.audioSourceMenu} onChange={e => this.interpolationModeChange(e)}>
                    <option value="linear">Linear</option>
                    <option value="speedUp">Speed Up</option>
                    <option value="slowDown">Slow Down</option>
                </select>
                {
                    this.state.interpolationMode != "linear" ?
                    <div>
                        <br/>
                        <label>Curve </label>
                        <input type="number" ref={this.interpolationInput} defaultValue="1"></input>
                    </div> : ""
                }
                <br/><br/><br/>

                <label htmlFor="audioSources">Audio source </label>
                <select name="audioSources" id="audioSources" ref={this.audioSourceMenu} onChange={e => this.audioSourceChange(e)}>
                    <option key={0} value="none">none</option>
                    {
                        this.props.audioSources.map((audioSource, key) => 
                        <option key={key + 1} value={audioSource}>{audioSource}</option>)
                    }
                </select>
                {
                    this.state.audioLinkEnabled ?
                    <div>
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
                    </div> : ""
                }
                
                <br/>
                <button onClick={() => this.renderFrames()} style={{ float: "right", marginTop: "16px" }} disabled={somethingIsRendering}>Render</button>
            </div>
        );
    }

    renderFrames()
    {
        let firstFrameSettings = this.props.keyframes[this.props.index].settings;
        let lastFrameSettings = this.props.keyframes[this.props.index + 1].settings;

        if(firstFrameSettings.mode != lastFrameSettings.mode)
        {
            alert("Cannot render transition for keyframes that use different process modes");
            return;
        }

        //clear previously rendered frames
        State.clearTransitionFramebank(this.props.index);

        let framesInput = this.framesInput.current as HTMLInputElement;
        let frames = parseInt(framesInput.value);

        if(isNaN(frames))
        {
            alert("Please provide number of frames");
            return;
        }

        let interpolation = this.getInterpolationExponent();
        if(!interpolation) return;

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
            ImageProcessor.instance.processAnimation(this.props.imageData, frames, firstFrameSettings, lastFrameSettings, this.props.encodingAlgorithm, interpolation as number, this.props.index, audioLink); 
        }, 100);
    }

    getAudioLinkParameterType(index : number | undefined) : ParameterType
    {
        if(index == undefined || index > this.parameterList.length - 1) return "none"; //error state, should never happen

        return this.parameterList[index] as ParameterType;
    }

    audioSourceChange(e : React.ChangeEvent<HTMLSelectElement>)
    {
        this.setState({ audioLinkEnabled: e.target.value != "none" });
    }

    interpolationModeChange(e : React.ChangeEvent<HTMLSelectElement>)
    {
        this.setState({ interpolationMode: e.target.value as InterpolationMode });
    }

    getInterpolationExponent() : number | null
    {
        if(this.state.interpolationMode == "linear") return 1; //linear interpolation

        let interpolationInput = this.interpolationInput.current as HTMLInputElement;
        let interpolation = parseFloat(interpolationInput.value);

        if(isNaN(interpolation) || interpolation <= 0)
        {
            alert("Interpolation factor must be a number higher than 0");
            return null;
        }

        if(this.state.interpolationMode == "slowDown")
            return 1 / interpolation;

        return interpolation;
    }
}