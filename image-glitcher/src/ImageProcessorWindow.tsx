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
                <label htmlFor="encoding">Encoding algorithm </label>
                <select id="encoding" ref="encodingInput" onChange={() => this.onChangeEncoding()}>
                    <option value="mulaw">μ-law</option>
                    <option value="alaw">a-law</option>
                </select>
                <br />
                <br />
                <h2 style={Styles.h2Style}>Amplitude Modulation</h2>
                <button style={Styles.bigButtonStyle} onClick={() => this.generateRandomFrame()}>Random</button>
            </div>
        );
    }

    generateRandomFrame()
    {
        ImageProcessorAmpMod.instance.generateRandomFrame(this.props.imageData, this.props.encodingAlgorithm);
    }

    onChangeEncoding()
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        State.setEncodingAlgorithm(encodingInput.value as "mulaw" | "alaw");
    }
}
