import React, { createRef } from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { IconButton } from './IconButton';
import { AudioProcessor } from './AudioProcessor';
import { Waveform } from './Waveform';
import { DSPTestBench } from './DSPTestBench';

interface DSPTestBenchWindowProps
{
}

interface DSPTestBenchWindowState
{
    audioFile : File | null,
    downloadUrl : string
}

export class DSPTestBenchWindow extends React.Component<DSPTestBenchWindowProps, DSPTestBenchWindowState>
{
    audioProcessor = new AudioProcessor();
    dspTestBench = new DSPTestBench();

    parameters = [ "frequency", "phase", "amp", "offset" ];
    paramInputs : HTMLInputElement[] | null[] = [];
    fileInput = createRef<HTMLInputElement>();

    state : DSPTestBenchWindowState = { audioFile: null, downloadUrl: "" };

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
            display: "inline-block",
            width: "70%",
            userSelect: "none"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>DSP Test Bench</h1>
                {this.parameters.map((parameterName, key) => (
                    <div key={key}>
                        <label>{parameterName}: </label>
                        <input name={parameterName} type="number" ref={paramInput => this.paramInputs[key] = paramInput} defaultValue={0} />
                        <br /><br />
                    </div>
                ), this)}
                <h1 style={Styles.h1Style}>Source</h1>
                <input type="file" ref={this.fileInput} onChange={async () => await this.loadAudioFromFile()} />
                <br /><br />
                <IconButton iconName="process" onClick={() => this.process()}/>
                {this.state.downloadUrl == "" ? "" : <a href={this.state.downloadUrl}>Download wav file</a>}
            </div>);
    }

    async process()
    {
        if (!this.state.audioFile) return;

        let audioBuffer = await this.audioProcessor.decodeFile(this.state.audioFile);

        console.log(audioBuffer)

        let processorSettings = { };
        for(let i = 0; i < this.paramInputs.length; i++)
        {
            let paramInput = this.paramInputs[i];
            let paramName = paramInput?.name as string;
            let paramValue = paramInput?.valueAsNumber as number;

            //@ts-ignore
            processorSettings[paramName] = paramValue;
        }

        let downloadUrl = this.dspTestBench.processAudioBuffer(audioBuffer, processorSettings);
        this.setState({ downloadUrl: downloadUrl });
    }

    async loadAudioFromFile()
    {
        let audioFile = this.fileInput.current?.files![0];

        if(!audioFile)
        {
            alert("Audio file not found");
            return;
        }

        console.log(audioFile)
        this.setState({ audioFile: audioFile });
    }
}