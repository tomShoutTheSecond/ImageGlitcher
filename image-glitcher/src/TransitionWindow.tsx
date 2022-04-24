import React, { createRef } from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { KeyFrame, TransitionFramebank, State, EncodingAlgorithm } from './App';
import { ImageProcessor } from './ImageProcessor';
import { settings } from 'cluster';
import { AudioLink, ParameterType } from './AudioLink';
import { FrameInspectorWindow } from './FrameInspectorWindow';
import { Card } from 'material-ui';

interface TransitionWindowProps 
{ 
    imageData : Uint8Array,
    frameSequence : Uint8Array[]

    keyframes : KeyFrame[],
    transitionFrames : TransitionFramebank[],
    encodingAlgorithm : EncodingAlgorithm,
    index : number,
    audioSources : string[],
    audioBuffers : number[][],
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

        let progressColor = Colors.fill;
        switch(thisTransition.status)
        {
            case "pending":
                progressColor = Colors.fill;
                break;
            case "rendering":
                progressColor = Colors.rendering;
                break;
            case "complete":
                progressColor = Colors.complete;
                break;
        }

        let containerStyle : React.CSSProperties = 
        {
            margin: "0 16px 16px 16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block",
            borderRadius: "8px"
        };

        let progressWidth = 192;
        let progressBarStyle : React.CSSProperties = 
        {
            background: thisTransition.status == "pending" ? Colors.pending : Colors.fill,
            outline: "1px solid " + Colors.border,
            width: progressWidth,
            height: "24px",
            marginBottom: "16px",
            borderRadius: "8px",
            position: "relative",
            overflow: "hidden"
        };

        let progressBarInnerStyle : React.CSSProperties = 
        {
            visibility: thisTransition.progress === 0 ? "hidden" : "visible",
            background: progressColor,
            //outline: "1px solid black",
            width: progressWidth * thisTransition.progress,
            height: "24px",
            borderRadius: "8px"
        };

        let somethingIsRendering = false;
        this.props.transitionFrames.forEach((transition : TransitionFramebank) => 
        { 
            if(transition.status === "rendering")
                somethingIsRendering = true;
        });

        let statusLabelStyle : React.CSSProperties = 
        {
            position: "absolute",
            top: 0,
            right: 0,
            width: "100%",
            height: "24px",
            textAlign: "center",
            verticalAlign: "center",
            color: Colors.white
        }

        return (
            <Card style={containerStyle}>
                <h1 style={Styles.h1Style}>Transition</h1>
                <div style={progressBarStyle}>
                    <div style={progressBarInnerStyle}/>
                    <div style={statusLabelStyle}>{thisTransition.status}</div>
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
                <button onClick={async () => await this.renderSequenceFrames()} style={{ float: "right", marginTop: "16px" }} disabled={somethingIsRendering}>Render sequence</button>
            </Card>
        );
    }

    prepareToRender()
    {
        let firstFrameSettings = this.props.keyframes[this.props.index].settings;
        let lastFrameSettings = this.props.keyframes[this.props.index + 1].settings;

        if(firstFrameSettings.mode != lastFrameSettings.mode)
        {
            alert("Cannot render transition for keyframes that use different process modes");
            return  { success: false };
        }

        let totalFrames = this.getNumberOfFrames();
        if(isNaN(totalFrames))
        {
            alert("Please provide number of frames");
            return  { success: false };
        }

        //clear previously rendered frames
        State.clearTransitionFramebank(this.props.index);

        let interpolation = this.getInterpolationExponent();
        if(!interpolation) 
            return { success: false };

        let audioLink = this.getAudioLink();

        return { success: true, totalFrames: totalFrames, firstFrameSettings: firstFrameSettings, lastFrameSettings: lastFrameSettings, interpolation: interpolation, audioLink: audioLink };
    }

    renderFrames()
    {
        let renderParams = this.prepareToRender();
        if(!renderParams.success)
            return;

        State.setTransitionRenderStatus(this.props.index, "rendering");

        setTimeout(() => 
        { 
            ImageProcessor.instance.processAnimation(this.props.imageData, renderParams.totalFrames!, renderParams.firstFrameSettings!, renderParams.lastFrameSettings!, this.props.encodingAlgorithm, renderParams.interpolation!, this.props.index, renderParams.audioLink!); 
        }, 100);
    }

    async renderSequenceFrames()
    {
        if(this.props.frameSequence.length == 0)
        {
            alert("No frame sequence loaded");
            return;
        }

        let renderParams = this.prepareToRender();
        if(!renderParams.success)
            return;

        let totalFrames = renderParams.totalFrames!;
        let counterCallback = (count : number) => State.setTransitionRenderProgress(this.props.index, count / totalFrames);

        //calculate firstFrameIndex by adding up the lengths of the previous transitions
        let firstFrameIndex = this.getFirstFrameIndex();
        let lastFrameIndex = firstFrameIndex + totalFrames;

        if(lastFrameIndex > this.props.frameSequence.length)
        {
            console.log("firstFrameIndex: ", firstFrameIndex);
            console.log("lastFrameIndex: ", lastFrameIndex);
            console.log("this.props.frameSequence.length: ", this.props.frameSequence.length);

            if(!window.confirm("Frame sequence not long enough. Would you like to loop the sequence?"))
                return;

            //looping frame sequence
            lastFrameIndex = this.props.frameSequence.length;
        }

        let shortFrameSequence = this.props.frameSequence.slice(firstFrameIndex, lastFrameIndex);

        console.log(`Frame sequence has ${shortFrameSequence.length} frames, rendering a total of ${totalFrames} frames (looping may occur)`);

        State.setTransitionRenderStatus(this.props.index, "rendering");
        await ImageProcessor.instance.processFrameSequence(shortFrameSequence, totalFrames, renderParams.firstFrameSettings!, renderParams.lastFrameSettings!, this.props.encodingAlgorithm, renderParams.interpolation!, this.props.index, renderParams.audioLink!, counterCallback);
        State.setTransitionRenderStatus(this.props.index, "complete");
    }

    getFirstFrameIndex()
    {
        let firstFrameIndex = 0;
        for(let frameBank of this.props.transitionFrames)
            firstFrameIndex += frameBank.frames.length;

        return firstFrameIndex;
    }

    getAudioLink()
    {
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

        return audioLink;
    }

    getAudioLinkParameterType(index : number | undefined) : ParameterType
    {
        if(index == undefined || index > this.parameterList.length - 1) 
            return "none"; //error state, should never happen

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

    getNumberOfFrames()
    {
        let framesInput = this.framesInput.current as HTMLInputElement;
        let frames = parseInt(framesInput.value);

        return frames;
    }
}