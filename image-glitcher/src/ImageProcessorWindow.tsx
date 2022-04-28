import React, { CSSProperties } from 'react';
import { State, KeyFrame, EncodingAlgorithm } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Util } from './Util';
import { FramebankWindow } from './FramebankWindow';
import { ImageProcessor, ProcessorMode } from './ImageProcessor';
import { IconButton } from './IconButton';
import { Card } from 'material-ui';

interface ImageProcessorWindowProps
{
    imageData : Uint8Array[],
    encodingAlgorithm : EncodingAlgorithm,
}

export class ImageProcessorWindow extends React.Component<ImageProcessorWindowProps>
{
    state = { previewUrl: "" };

    render()
    {
        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Process Image</h1>
                <label htmlFor="encoding" style={Styles.leftMargin}>Encoding algorithm </label>
                <select id="encoding" ref="encodingInput" style={Styles.leftMargin} onChange={() => this.onChangeEncoding()}>
                    <option value="mulaw">μ-law</option>
                    <option value="alaw">a-law</option>
                </select>
                <br />
                <br />
                <h2 style={Styles.h2Style}>Amplitude Modulation</h2>
                <div style={Styles.alignRight}>
                    <IconButton iconName="dice-multiple" hint="Randomise" onClick={() => this.generateRandomFrame("ampMod")} borderColorIndex={0}/>
                </div>
                <h2 style={Styles.h2Style}>Delay</h2>
                <div style={Styles.alignRight}>
                    <IconButton iconName="dice-multiple" hint="Randomise" onClick={() => this.generateRandomFrame("delay")} borderColorIndex={1}/>
                </div>
                <h2 style={Styles.h2Style}>Shuffle</h2>
                <div style={Styles.alignRight}>
                    <IconButton iconName="dice-multiple" hint="Randomise" onClick={() => this.generateRandomFrame("shuffle")} borderColorIndex={2}/>
                </div>
            </Card>
        );
    }

    generateRandomFrame(mode : ProcessorMode)
    {
        ImageProcessor.instance.generateRandomFrame(this.props.imageData[0], this.props.encodingAlgorithm, mode);
    }

    onChangeEncoding()
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        State.setEncodingAlgorithm(encodingInput.value as EncodingAlgorithm);
    }
}
