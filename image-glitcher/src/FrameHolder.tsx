import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';

interface FrameHolderProps
{
    frame : Frame,
    frameIndex : number
}

interface FrameHolderState
{
    hover : boolean
}

export class FrameHolder extends React.Component<FrameHolderProps, FrameHolderState>
{
    state = { hover: false };

    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            display: "inline-block",
            position: "relative"
        };

        let overlayContainerStyle : React.CSSProperties = 
        {
            color: Colors.white,
            background: Colors.transBlack,
            display: this.state.hover ? "block" : "none",
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            padding: "8px",
            boxSizing: "border-box"
        };

        let iconSize = "48px";
        let iconStyle : React.CSSProperties = 
        {
            width: iconSize,
            height: iconSize
        };

        //
        //{Util.getFrameName(this.props.frameIndex)}
        
        //img element has className downloadImg to make it easier to find later

        return (
            <div style={containerStyle} onMouseEnter={() => this.mouseEnter()} onMouseLeave={() => this.mouseLeave()}>
                <img className="downloadImg" src={this.props.frame.url} style={Styles.imageStyle}></img>
                <div style={overlayContainerStyle}>
                    <a href={this.props.frame.url} target="_blank"><img src={process.env.PUBLIC_URL + '/icons/arrow-expand.svg'} style={iconStyle}/></a>
                    <a href={this.props.frame.url} download={Util.getFrameName(this.props.frameIndex)}><img src={process.env.PUBLIC_URL + '/icons/download.svg'} style={iconStyle}/></a>
                    {Object.keys(this.props.frame.ampModSettings).map((settingName, key) => {
                        let settingValue = Object.values(this.props.frame.ampModSettings)[key];
                        return(
                            <p key={key}>{settingName}: {settingValue}</p>
                        );
                    })}
                </div>
            </div>
        );
    }

    mouseEnter()
    {
        this.setState({ hover: true });
    }

    mouseLeave()
    {
        this.setState({ hover: false });
    }
}
