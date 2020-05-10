import React from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';

interface FramePreviewProps
{
    downloads : string[],
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
        };

        let downloadContainerStyle : React.CSSProperties = 
        {
            display: "inline-block"
        };

        let content = this.props.isLoading ? "Loading frames..." : this.props.downloads.map((download, key) => 
            <div key={key} style={downloadContainerStyle}>
                <img className="downloadImg" src={download} style={Styles.imageStyle}></img>
                <a href={download} download="image.bmp">{"image-" + key}</a>
            </div>
        )
        

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Frames</h1>
                {content}
                <br />
                <button onClick={() => this.createGif()}>Convert to GIF</button>
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

    //returns references to all the preview image elements in the download area
    getImageElements()
    {
        let thisNode = ReactDOM.findDOMNode(this)! as Element;
        return Array.from(thisNode.getElementsByClassName('downloadImg'));
    }
}
