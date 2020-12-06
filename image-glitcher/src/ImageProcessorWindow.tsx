import React from 'react';
import { State, KeyFrame, EncodingAlgorithm } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Util } from './Util';
import { FramebankWindow } from './FramebankWindow';
import { ImageProcessor, ProcessorMode } from './ImageProcessor';
import { IconButton } from './IconButton';

interface ImageProcessorWindowProps
{
    imageData : Uint8Array,
    encodingAlgorithm : EncodingAlgorithm,
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
                <div style={Styles.alignRight}>
                    <IconButton iconName="dice-multiple" onClick={() => this.generateRandomFrame("ampMod")}/>
                </div>
                <h2 style={Styles.h2Style}>Delay</h2>
                <div style={Styles.alignRight}>
                    <IconButton iconName="dice-multiple" onClick={() => this.generateRandomFrame("delay")}/>
                </div>
            </div>
        );
    }

    generateRandomFrame(mode : ProcessorMode)
    {
        ImageProcessor.instance.generateRandomFrame(this.props.imageData, this.props.encodingAlgorithm, mode);
    }

    onChangeEncoding()
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        State.setEncodingAlgorithm(encodingInput.value as EncodingAlgorithm);
    }
}
