import React from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';
import { IconButton } from './IconButton';

interface FramebankWindowProps
{
    frames : KeyFrame[],
    isLoading : boolean
}

export class FramebankWindow extends React.Component<FramebankWindowProps>
{
    static instance : FramebankWindow | null = null;

    componentDidMount()
    {
        FramebankWindow.instance = this;
    }

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
            width: "70%"
        };

        let content = this.props.isLoading ? "Loading frames..." : this.props.frames.map((frame, key) => 
            <FrameHolder key={key} frame={frame} frameIndex={key} context="framebank"/>
        );

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Framebank</h1>
                {content}
                <br />
                <IconButton iconName="download" onClick={() => this.downloadFrames()}/>
            </div>
        );
    }

    downloadFrames()
    {
        let zip = new JSZip();

        for (let i = 0; i < this.props.frames.length; i++) 
        {
            const frame = this.props.frames[i];
            zip.file(Util.getFrameName(i), frame.data);
        }

        zip.generateAsync({ type:"blob" }).then(function(content) 
        {
            //see FileSaver.js
            saveAs(content, "Framebank.zip");
        });
    }
}
