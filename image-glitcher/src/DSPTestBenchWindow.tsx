import React, { createRef } from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import { IconButton } from './IconButton';
import { AudioProcessor } from './AudioProcessor';
import { Waveform } from './Waveform';
import { DSPTestBench } from './DSPTestBench';
import { Card } from '@material-ui/core';

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

    parameters = [ "delay", "feedback", "mix" ];
    paramInputs : HTMLInputElement[] | null[] = [];
    fileInput = createRef<HTMLInputElement>();

    state : DSPTestBenchWindowState = { audioFile: null, downloadUrl: "" };

    render()
    {
        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>DSP Test Bench</h1>
                <div style={Styles.leftMargin}>
                    {this.parameters.map((parameterName, key) => (
                        <div key={key}>
                            <label>{parameterName}: </label>
                            <input name={parameterName} type="number" ref={paramInput => this.paramInputs[key] = paramInput} defaultValue={0} />
                            <br /><br />
                        </div>
                    ), this)}
                </div>
                <h1 style={Styles.h1Style}>Audio Source</h1>
                <input type="file" ref={this.fileInput} onChange={async () => await this.loadAudioFromFile()} />
                <br /><br />
                <div style={Styles.bottomLeftMargin}>
                    <IconButton iconName="process" hint="Process" onClick={() => this.process()}/>
                </div>
                {this.state.downloadUrl == "" ? "" : <a href={this.state.downloadUrl}>Download wav file</a>}
            </Card>);
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