import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';

interface FramePreviewProps
{
    frames : Frame[],
    isLoading : boolean
}

export class FramePreview extends React.Component<FramePreviewProps>
{
    static instance : FramePreview | null = null;

    componentDidMount()
    {
        FramePreview.instance = this;
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
            <FrameHolder frame={frame} frameIndex={key}/>
        );

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Frames</h1>
                {content}
                <br />
                <button onClick={() => this.createGif()}>Convert to GIF</button>
                <button onClick={() => this.downloadFrames()}>Download Frames</button>
            </div>
        );
    }

    createGif()
    {
        State.setAnimationLoadingState(true);

        //first find the actual image size of the first frame
        var newImg = new Image();
        newImg.onload = () =>
        {
            let width = newImg.width;
            let height = newImg.height;

            //@ts-ignore
            let gif = new GIF(
            {
                workers: 2,
                quality: 10,
                width: width,
                height: height
            });

            //add frames to gif
            let imgElements = this.getImageElements();
            imgElements.forEach(img => 
            {
                gif.addFrame(img, {delay: 10});
            });
            
            gif.on('finished', function(blob : Blob) 
            {
                let url = URL.createObjectURL(blob);
                State.setAnimationUrl(url);
                State.setAnimationLoadingState(false);
            });
            
            gif.render();
        }

        let firstImage = this.getImageElements()[0] as HTMLImageElement;
        newImg.src = firstImage.src;
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
            saveAs(content, "example.zip");
        });
    }

    //returns references to all the preview image elements in the download area
    getImageElements()
    {
        let thisNode = ReactDOM.findDOMNode(this)! as Element;
        return Array.from(thisNode.getElementsByClassName('downloadImg'));
    }
}
