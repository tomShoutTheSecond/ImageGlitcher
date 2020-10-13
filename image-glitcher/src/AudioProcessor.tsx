import { Util } from './Util';

export class AudioProcessor
{
    audioContext = new AudioContext();

    async decodeFile(file : File)
    {
        return new Promise<AudioBuffer>((resolve, reject) => 
        {
            var reader1 = new FileReader();
            reader1.onload = ev =>
            {
                // Decode audio
                this.audioContext.decodeAudioData(ev!.target!.result as ArrayBuffer).then(buffer => 
                {
                    //var soundSource = this.audioContext.createBufferSource();
                    //soundSource.buffer = buffer;

                    resolve(buffer);
                });
            };
    
            reader1.readAsArrayBuffer(file);
        });
    }

    processBuffer(buffer : AudioBuffer, smoothingValue : number, framesPerSecond : number)
    {
        let leftSamples = buffer.getChannelData(0);

        //make lowpass buffer larger for more smoothing?
        //TODO: check this is correct DSP, lowpassBuffer length only seems to affect amplitude
        let lowpassBuffer = [];
        for (let i = 0; i < smoothingValue; i++) 
        {
            lowpassBuffer.push(0);
        }

        let lowpassedBuffer = [];

        for (let i = 0; i < leftSamples.length; i++) 
        {
            let sample = leftSamples[i];

            let sampleSquared = sample * sample;

            //add sample to lowpass buffer
            lowpassBuffer.unshift(sampleSquared);

            //remove oldest sample from lowpass buffer
            lowpassBuffer.pop();

            //apply lowpass processing to sample
            let sampleSquaredLowpassed = this.averageOfArray(lowpassBuffer);
            let sampleLowpassed = Math.sqrt(sampleSquaredLowpassed);

            lowpassedBuffer.push(sampleLowpassed);
        }

        //find interpolated values for where the frames land
        let outputBuffer = [];

        //frames land every sampleRateCoef elements
        let sampleRateCoef = buffer.sampleRate / framesPerSecond;
        let totalFramesAudioCovers = buffer.length / sampleRateCoef;
        for (let i = 0; i < totalFramesAudioCovers; i++) 
        {
            let floatingIndex = sampleRateCoef * i;
            let interpolatedSample = this.findInterpolatedValue(lowpassedBuffer, floatingIndex);
            outputBuffer.push(interpolatedSample);
        }

        return outputBuffer;
    }

    //returns an interpolated value from a buffer when you need a value for an abstract (non integer) index
    findInterpolatedValue(inputBuffer : number[], floatingIndex : number)
    {
        let lowIndex = Math.floor(floatingIndex);
        let highIndex = Math.ceil(floatingIndex);

        let lowValue = inputBuffer[lowIndex];
        let highValue = inputBuffer[highIndex];

        let decimalPortion = floatingIndex % 1;

        //linear interpolation
        return Util.mixNumber(lowValue, highValue, decimalPortion);
    }

    averageOfArray(array : number[])
    {
        let sum = 0;
        for (let i = 0; i < array.length; i++ )
        {
            sum += array[i]; //don't forget to add the base
        }
        
        return sum / array.length;
    }
}