import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Util } from './Util';
import { FramebankWindow } from './FramebankWindow';
import { ImageProcessorAmpMod } from './ImageProcessorAmpMod';

export class AmpModSettings
{
    frequency = 0;
    phase = 0;
    amp = 0;
    offset = 0;

    constructor(frequency : number, phase : number, amp : number, offset : number)
    {
        this.frequency = frequency;
        this.phase = phase;
        this.amp = amp;
        this.offset = offset;
    }
}

interface ImageProcessorWindowProps
{
    imageData : Uint8Array,
    encodingAlgorithm : "mulaw" | "alaw"
}

export class ImageProcessorWindow extends React.Component<ImageProcessorWindowProps>
{
    state = { previewUrl: "" };

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
            display: "inline-block"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Process Image</h1>
                <label htmlFor="frames">Frames</label> <input id="frames" ref="framesInput" type="number" defaultValue="1"/>
                <br />
                <br />
                <label htmlFor="boomerang">Boomerang</label> <input id="boomerang" ref="boomerangInput" type="checkbox"/>
                <br />
                <br />
                <label htmlFor="encoding">Encoding algorithm </label>
                <select id="encoding" ref="encodingInput" onChange={() => this.onChangeEncoding()}>
                    <option value="mulaw">μ-law</option>
                    <option value="alaw">a-law</option>
                </select>
                <br />
                <br />
                <h2 style={Styles.h2Style}>Amplitude Modulation</h2>
                <label htmlFor="startFreq">Start Frequency</label> <input id="startFreq" ref="startFreqInput" type="number" defaultValue="0.01"/>
                <br />
                <label htmlFor="endFreq">End Frequency</label> <input id="endFreq" ref="endFreqInput" type="number" defaultValue="0.01"/>
                <br />
                <br />
                <label htmlFor="startPhase">Start Phase</label> <input id="startPhase" ref="startPhaseInput" type="number" defaultValue="0"/>
                <br />
                <label htmlFor="endPhase">End Phase</label> <input id="endPhase" ref="endPhaseInput" type="number" defaultValue="0"/>
                <br />
                <br />
                <label htmlFor="startAmp">Start Amp</label> <input id="startAmp" ref="startAmpInput" type="number" defaultValue="1"/>
                <br />
                <label htmlFor="endAmp">End Amp</label> <input id="endAmp" ref="endAmpInput" type="number" defaultValue="1"/>
                <br />
                <br />
                <label htmlFor="startOffset">Start DC Offset</label> <input id="startOffset" ref="startOffsetInput" type="number" defaultValue="1"/>
                <br />
                <label htmlFor="endOffset">End DC Offset</label> <input id="endOffset" ref="endOffsetInput" type="number" defaultValue="1"/>
                <br />
                <br />
                <button style={Styles.bigButtonStyle} onClick={() => this.prepareToProcessAnimation()}>Process</button>
                <button style={Styles.bigButtonStyle} onClick={() => this.generateRandomFrame()}>Random</button>
            </div>
        );
    }

    prepareToProcessAnimation()
    {
        //clear downloads area
        State.clearFramebank();
        State.setFrameLoadingState(true);

        //wait to let renderer catch up
        let waitTime = 200;
        setTimeout(() => this.processAnimation(), waitTime);
    }

    processAnimation()
    {
        let framesInput = this.refs.framesInput as HTMLInputElement;
        let frames = parseInt(framesInput.value);

        let boomerangInput = this.refs.boomerangInput as HTMLInputElement;
        let boomerang = boomerangInput.checked;

        let startFreqInput = this.refs.startFreqInput as HTMLInputElement;
        let endFreqInput = this.refs.endFreqInput as HTMLInputElement;
        let startPhaseInput = this.refs.startPhaseInput as HTMLInputElement;
        let endPhaseInput = this.refs.endPhaseInput as HTMLInputElement;
        let startAmpInput = this.refs.startAmpInput as HTMLInputElement;
        let endAmpInput = this.refs.endAmpInput as HTMLInputElement;
        let startOffsetInput = this.refs.startOffsetInput as HTMLInputElement;
        let endOffsetInput = this.refs.endOffsetInput as HTMLInputElement;

        let startFreq = parseFloat(startFreqInput.value);
        let endFreq = parseFloat(endFreqInput.value);
        let startPhase = parseFloat(startPhaseInput.value);
        let endPhase = parseFloat(endPhaseInput.value);
        let startAmp = parseFloat(startAmpInput.value);
        let endAmp = parseFloat(endAmpInput.value);
        let startOffset = parseFloat(startOffsetInput.value);
        let endOffset = parseFloat(endOffsetInput.value);

        let startSettings = new AmpModSettings(startFreq, startPhase, startAmp, startOffset);
        let endSettings = new AmpModSettings(endFreq, endPhase, endAmp, endOffset);

        ImageProcessorAmpMod.processAnimation(this.props.imageData, frames, startSettings, endSettings, boomerang, this.props.encodingAlgorithm);
    }

    generateRandomFrame()
    {
        ImageProcessorAmpMod.generateRandomFrame(this.props.imageData, this.props.encodingAlgorithm);
    }

    onChangeEncoding()
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        State.setEncodingAlgorithm(encodingInput.value as "mulaw" | "alaw");
    }
}
