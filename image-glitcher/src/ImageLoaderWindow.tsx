import React from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import Jimp from 'jimp';
import { Util } from './Util';

export class ImageLoaderWindow extends React.Component
{
    state = { previewUrl: "", isConverting: false };

    render()
    {
        let innerContainerStyle : React.CSSProperties = 
        {
            paddingBottom: "16px"
        };

        let previewImage = this.state.isConverting ? <h2>Converting image...</h2> : <img src={this.state.previewUrl} style={Styles.imageStyle}/>;

        return (
            <div style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Load Image</h1>
                <p>Files will be converted to .bmp</p>
                <div style={innerContainerStyle}>
                    <input ref="fileInput" type="file" id="files" name="file" onChange={() => this.loadImageFromFile()}/>
                </div>
                {previewImage}
            </div>
        );
    }

    loadImageFromFile()
    {
        let fileInput = this.refs.fileInput as HTMLInputElement;
        let imageFile = fileInput.files![0];

        if(!imageFile)
        {
            alert("Image file not found");
            return;
        }
        
        //double check with user before clearing frames
        if(State.needsLoadWarning() && !window.confirm('Are you sure you want to load a new image? This will clear the timeline and all frames!')) 
        {
            return;
        }

        State.clearFramebank();
        State.clearKeyframes();
        State.clearAllTransitionFrames();

        let imageIsBitmap = imageFile.name.endsWith(".bmp");
        
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(imageFile);
        fileReader.onloadend = () =>
        {
            //get data from file (if bitmap was supplied)
            if(imageIsBitmap)
            {
                let result = fileReader.result as ArrayBuffer;
                let rawData = new Uint8Array(result);
                State.setImageData(rawData);
            }

            //put preview in component
            fileReader.readAsDataURL(imageFile);

            fileReader.onloadend = async () =>
            {
                let originalImageUrl = fileReader.result as string;

                if(!imageIsBitmap)
                {
                    this.setState({ isConverting: true });
                    let convertedImage = await Util.convertImage(originalImageUrl);
                    this.loadConvertedImage(convertedImage);
                }
                else
                {
                    this.setState({ previewUrl: originalImageUrl });
                    console.log("Original image was loaded");
                }
            }
        }
    }

    loadConvertedImage(imageBlob : Blob)
    {
        let fileReader = new FileReader();

        //set image data
        fileReader.onloadend = () =>
        {
            let result = fileReader.result as ArrayBuffer;
            let convertedImageData = new Uint8Array(result);
            State.setImageData(convertedImageData);

            //show converted image in preview
            URL.revokeObjectURL(this.state.previewUrl);
            let convertedImageUrl = window.URL.createObjectURL(imageBlob);
            this.setState({ previewUrl: convertedImageUrl, isConverting: false });

            console.log("Converted image was loaded");
        }
        fileReader.readAsArrayBuffer(imageBlob);
    }

    
}
