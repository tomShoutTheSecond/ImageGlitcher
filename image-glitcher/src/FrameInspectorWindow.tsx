import React, { RefObject, createRef, useRef } from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM, { findDOMNode } from 'react-dom';
import { Button, Card } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { IIndexable, setStateAsync, Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { ImageProcessorWindow } from './ImageProcessorWindow';
import { ImageProcessor, AmpModSettings, ImageProcessorSettings, DelaySettings, ShuffleSettings, ProcessorMode } from './ImageProcessor';
import { IconButton } from './IconButton';
import Jimp from 'jimp';

interface FrameInspectorProps
{
    frame : KeyFrame | null,
    imageData : Uint8Array[],
    encodingAlgorithm : string,
}

interface FrameInspectorState
{
    settings : ImageProcessorSettings,
    settingsText : string,
    textNeedsParse : boolean
}

export class FrameInspectorWindow extends React.Component<FrameInspectorProps, FrameInspectorState>
{
    state = { settings: new ImageProcessorSettings(), settingsText: "", textNeedsParse: false };
    
    fileInput = createRef<HTMLInputElement>();
    textArea = createRef<HTMLTextAreaElement>();

    render()
    {
        let numberInputStyle : React.CSSProperties = 
        {
            width: "100px"
        };

        let textAreaStyle : React.CSSProperties = 
        {
            width: "100%",
            height: "auto",
            padding: "16px 16px 0 16px",
            color: this.state.textNeedsParse ? Colors.sunset[0] : Colors.lightGrey,
            background: Colors.transparent,
            border: "none",
            overflow: "auto",
            outline: "none",
            boxShadow: "none",
            resize: "none"
        };

        let previewImage = this.props.frame == null ? <p style={Styles.leftMargin}>No image</p> : <img src={this.props.frame.url} style={Styles.imageStyle}/>;
        let settingsForm = this.props.frame == null ? "" : <textarea ref={this.textArea} style={textAreaStyle} value={this.state.settingsText} onChange={e => this.setState({ settingsText: e.target.value, textNeedsParse: true })} spellCheck="false"></textarea>;

        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Inspector</h1>
                {previewImage}
                {settingsForm}
                <div style={Styles.alignRight}>
                    <IconButton iconName="image-move" hint="Render frame" onClick={async () => await this.renderFrame()}/>
                </div>
            </Card>
        );
    }

    async renderFrame()
    {
        await this.parseSettingsText();
        if(this.state.textNeedsParse)
            return; //user entered invalid settings text

        ImageProcessor.instance.processKeyFrame(this.props.imageData[0], this.state.settings, this.props.encodingAlgorithm);
    }

    componentWillReceiveProps(nextProps : FrameInspectorProps)
    {
        if(!nextProps.frame) return;

        //update settings when a frame is loaded to the inspector
        if(nextProps.frame.settings != this.props.frame?.settings)
        {
            let newSettingsText = this.getSettingsText(nextProps.frame.settings);
            this.setState({ settings: nextProps.frame.settings, settingsText: newSettingsText });
        }
    }

    componentDidUpdate()
    {
        this.resizeTextArea();
    }

    getSettingsText(settings : ImageProcessorSettings)
    {
        let settingsText = settings.mode + "\n";
        switch(settings.mode)
        {
            case "ampMod":
                for(let settingName of Object.keys(settings.ampModSettings))
                {
                    let settingValue = (settings.ampModSettings as IIndexable<number>)[settingName];
                    let settingText = `${settingName}: ${settingValue}\n`;
                    settingsText += settingText;
                }
                break;
            case "delay":
                for(let settingName of Object.keys(settings.delaySettings))
                {
                    let settingValue = (settings.delaySettings as IIndexable<number>)[settingName];
                    let settingText = `${settingName}: ${settingValue}\n`;
                    settingsText += settingText;
                }
                break;
            case "shuffle":
                for(let settingName of Object.keys(settings.shuffleSettings))
                {
                    let settingValue = (settings.shuffleSettings as IIndexable<number>)[settingName];
                    let settingText = `${settingName}: ${settingValue}\n`;
                    settingsText += settingText;
                }
                break;
        }

        return settingsText.slice(0, -1); //remove trailing newline
    }

    //convert settingsText into a ImageProcessorSettings object
    async parseSettingsText()
    {
        let segments = this.state.settingsText.split(/: |\n/);
        let mode = segments[0] as ProcessorMode;
        segments = segments.slice(1);

        let keys = [];
        let values : number[] = [];

        let isValue = false;
        for(let segment of segments)
        {
            if(isValue)
                values.push(parseFloat(segment));
            else
                keys.push(segment);

            isValue = !isValue; //key and value segments alternate
        }

        let result = {} as IIndexable<number>;
        keys.forEach((key, i) => result[key] = values[i]);

        console.log(result);

        let newSettings = new ImageProcessorSettings();
        newSettings.mode = mode;
        switch(newSettings.mode)
        {
            case "ampMod":
                let ampModSettings = result as unknown as AmpModSettings;
                newSettings.ampModSettings = ampModSettings;
                break;
            case "delay":
                let delaySettings = result as unknown as DelaySettings;
                newSettings.delaySettings = delaySettings;
                break;
            case "shuffle":
                let shuffleSettings = result as unknown as ShuffleSettings;
                newSettings.shuffleSettings = shuffleSettings;
                break;
            default:
                //text did not start with a valid mode
                alert(`${newSettings.mode} is not a valid mode`);
                return;
        }

        console.log(newSettings);

        await setStateAsync(this, { settings: newSettings, settingsText: this.getSettingsText(newSettings), textNeedsParse: false });
    }

    resizeTextArea() 
    {
        window.requestAnimationFrame(() => 
        {
            let textArea = this.textArea.current;
            if(!textArea)
                return;

            textArea.style.height = 'auto';
            textArea.style.height = textArea.scrollHeight+'px';
        });
    }
}
