import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { Util } from './Util';
import { FramePreview } from './FramePreview';

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

interface ImageProcessorProps
{
    imageData : Uint8Array
}

export class ImageProcessor extends React.Component<ImageProcessorProps>
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
                <select id="encoding" ref="encodingInput">
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
            </div>
        );
    }

    prepareToProcessAnimation()
    {
        //clear downloads area
        State.clearFrames();
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

        for (let i = 0; i < frames; i++) 
        {
            let progress = i / frames;
            let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
            let framePhase = Util.mixNumber(startPhase, endPhase, progress);
            let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
            let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

            let settings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);

            this.processFrame(settings);
        }

        if(boomerang)
        {
            for (let i = 0; i < frames; i++) 
            {
                let progress = 1 - (i / frames);
                let frameFrequency = Util.mixNumber(startFreq, endFreq, progress);
                let framePhase = Util.mixNumber(startPhase, endPhase, progress);
                let frameAmp = Util.mixNumber(startAmp, endAmp, progress);
                let frameOffset = Util.mixNumber(startOffset, endOffset, progress);

                let settings = new AmpModSettings(frameFrequency, framePhase, frameAmp, frameOffset);

                this.processFrame(settings);
            }
        }

        State.setFrameLoadingState(false);

        //create animation (once image previews are loaded)
        let waitTime = 1000;
        setTimeout(() => FramePreview.instance?.createGif(), waitTime);
    }

    processFrame(settings : AmpModSettings)
    {
        //get data from file
        let rawData = this.props.imageData;
        
        //decode data
        let decodedFile = this.decodeFile(rawData);

        //process data
        let processedData = this.bufferProcess(decodedFile, settings);

        //encode data
        let encodedFile = this.encodeFile(processedData);
        
        this.saveByteArrayAsFrame(encodedFile, settings);
    }

    encodeFile(rawData : number[])
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        let encodingAlgorithm = encodingInput.value;

        //@ts-ignore
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.encode(rawData) : alawmulaw.alaw.encode(rawData);
    }

    decodeFile(rawData : Uint8Array)
    {
        let encodingInput = this.refs.encodingInput as HTMLInputElement;
        let encodingAlgorithm = encodingInput.value;

        //@ts-ignore
        return encodingAlgorithm === "mulaw" ? alawmulaw.mulaw.decode(rawData) : alawmulaw.alaw.decode(rawData);
    }

    bufferProcess(buffer : any, settings : AmpModSettings)
    {
        let headerLength = 54; //value seems to work well for bitmap files

        let frequency = settings.frequency
        let phase = settings.phase;
        let amp = settings.amp;
        let offset = settings.offset;

        let processedBuffer = [];
        for (let i = 0; i < buffer.length; i++) 
        {
            const sample = buffer[i];

            if(i < headerLength)
            {
                processedBuffer.push(sample);
                continue;
            }

            let angle = phase + i * frequency;
            let coef = offset + Math.sin(angle) * amp;

            let processedSample = sample * coef;
            processedBuffer.push(processedSample);
        }

        return processedBuffer;
    }

    saveByteArrayAsFrame(data : any, settings : AmpModSettings)
    {
        let blob = new Blob([data], {type: "image/bmp"});
        let url = window.URL.createObjectURL(blob);

        State.addFrame({ url: url, data: blob, ampModSettings: settings });
    }
}
