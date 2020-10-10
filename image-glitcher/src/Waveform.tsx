import React from 'react';
import { InterfaceUtilities } from './InterfaceUtilities';
import { ZoomScrollSlider } from './ZoomScrollSlider';
import { Colors } from './Colors';

interface WaveformState
{
    zoomLevel : number,
    scroll : number
}

interface WaveformProps
{
    buffer : number[],
    fileName : string,
    lastGrainCenter : number | null
}

export class Waveform extends React.Component<WaveformProps, WaveformState>
{
    static defaultProps = {
        fileName: "",
        lastGrainCenter: null
    };

    state = { zoomLevel: 1, scroll: 0.5 };

    get bufferIsLoaded()
    {
        return this.props.buffer.length > 1;
    }

    componentDidUpdate(prevProps : WaveformProps, prevState : WaveformState)
    {
        if(this.props.buffer !== prevProps.buffer || this.state.zoomLevel !== prevState.zoomLevel || this.state.scroll !== prevState.scroll)
            this.drawBuffer();

        if(this.props.lastGrainCenter !== prevProps.lastGrainCenter)
            this.drawGrainCenter();
    }

    render()
    {
        let waveformWidth = 512;
        let waveformHeight = 240;
        let marginHorizontal = 16;
        let marginTop = 16;
        let marginBottom = 0;

        let containerWidth = waveformWidth + marginHorizontal * 2;
        let containerHeight = waveformHeight + marginTop + marginBottom;

        let containerStyle : React.CSSProperties = {
            backgroundColor: Colors.border,
            height: containerHeight,
            width: containerWidth,
            display: "table-cell",
            verticalAlign: "top",
            position: "relative"
        };

        let canvasStyle : React.CSSProperties = {
            backgroundColor: Colors.background,
            position: "relative",
            top: marginTop,
            left: marginHorizontal,
            width: waveformWidth,
            height: waveformHeight
        };

        let bufferCanvasStyle : React.CSSProperties = Object.assign({}, canvasStyle);
        bufferCanvasStyle.position = "absolute";
        bufferCanvasStyle.backgroundColor = "transparent";

        let sliderContainerStyle : React.CSSProperties = {
            position: "absolute",
            left: 0,
            bottom: 0,
        };

        return(
            <div ref="container" style={containerStyle}>
                <canvas ref="bufferCanvas" style={canvasStyle}/>
                <canvas ref="grainCenterCanvas" style={bufferCanvasStyle}/>
                <div style={sliderContainerStyle}>
                    <ZoomScrollSlider onScrollChange={value => this.setScroll(value)} onZoomChange={value => this.setZoom(value)} width={waveformWidth} height={32} marginHorizontal={16} marginVertical={8}/>
                </div>
            </div>
        );
    }

    setZoom(value : number)
    {
        this.setState({ zoomLevel : value });
    }

    setScroll(value : number)
    {
        this.setState({ scroll : value });
    }

    drawBuffer()
    {
        if(!this.bufferIsLoaded) return;

        //TODO: get average of both channels?
        let channel0Samples = this.props.buffer;//.getChannelData(0);
        let zoomLevel = this.state.zoomLevel;

        let visibleBufferLength = channel0Samples.length * zoomLevel;
        let visibleBufferCenterRange = channel0Samples.length - visibleBufferLength;
        let visibleBufferCenterMin = visibleBufferLength * 0.5;
        let visibleBufferCenter = visibleBufferCenterMin + this.state.scroll * visibleBufferCenterRange;
        let visibleBufferStart = visibleBufferCenter - visibleBufferLength * 0.5;
        let bufferData = channel0Samples.slice(visibleBufferStart, visibleBufferStart + visibleBufferLength);

        let canvas = this.refs.bufferCanvas as HTMLCanvasElement;
        let context = canvas.getContext("2d")!;
        InterfaceUtilities.canvasFixDpi(canvas, context);

        //determines the image quality
        canvas.width = 500; //increasing this will slow it down

        let samplesPerPixel = Math.floor(bufferData.length / canvas.width);
        let samplesToDraw = [];

        let sampleBin = []; //current bin of samples that will be averaged together
        for(let i = 0; i < bufferData.length; i++)
        {
            if(sampleBin.length === samplesPerPixel) //bin is full
            {
                //average bin samples together
                let samplesTotal = 0;
                sampleBin.forEach(sample => 
                {
                    samplesTotal += sample;
                });

                let binAverage = samplesTotal / samplesPerPixel;
                samplesToDraw.push(binAverage);

                //empty the bin
                sampleBin = [];
            }

            //flip negative values and treat them as positive (to avoid negative values cancelling out positive ones in the same bin)
            let currentSample = bufferData[i];
            if(currentSample < 0)
                currentSample = 0 - currentSample;

            //put sample in bin
            sampleBin.push(currentSample);
        }

        //draw horizontal line across canvas (so silent samples don't appear blank)
        let halfCanvasHeight = canvas.height * 0.5;
        context.strokeStyle = Colors.white;
        context.beginPath();
        context.moveTo(0, halfCanvasHeight);
        context.lineTo(canvas.width, halfCanvasHeight);
        context.stroke();

        let zeroCrossing = canvas.height * 0.5;

        //draw the chosen samples
        for(let i = 0; i < samplesToDraw.length; i++)
        {
            //draw symmetrical waveform because we only have data for one side of the waveform
            let thisSample = samplesToDraw[i];
            
            let positiveYValue = zeroCrossing - thisSample * canvas.height;// halfCanvasHeight + thisSample * halfCanvasHeight * -1;
            context.beginPath();
            context.moveTo(i, positiveYValue);
            context.lineTo(i, zeroCrossing);
            context.stroke();
        }

        //draw the outline
        context.strokeStyle = Colors.black;
        for(let i = 0; i < samplesToDraw.length; i++)
        {
            if(i + 1 <= samplesToDraw.length - 1)
            {
                let thisSample = samplesToDraw[i];
                let nextSample = samplesToDraw[i + 1];
                let thisPositiveYValue = zeroCrossing - thisSample * canvas.height;//halfCanvasHeight + thisSample * halfCanvasHeight * -1;
                let nextPositiveYValue = zeroCrossing - nextSample * canvas.height;//halfCanvasHeight + nextSample * halfCanvasHeight * -1;

                context.beginPath();
                context.moveTo(i, thisPositiveYValue);
                context.lineTo(i + 1, nextPositiveYValue);
                context.stroke();
            }
        }
    }

    drawGrainCenter()
    {
        if(this.props.lastGrainCenter == null) return;

        let canvas = this.refs.grainCenterCanvas as HTMLCanvasElement;
        let context = canvas.getContext("2d")!;
        InterfaceUtilities.canvasFixDpi(canvas, context);

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = Colors.white;

        let xValue = Math.round(canvas.width * this.props.lastGrainCenter! / this.state.zoomLevel);
        
        if(xValue > canvas.width) return;

        context.moveTo(xValue, 0);
        context.lineTo(xValue, canvas.height);
        context.stroke();
    }
}