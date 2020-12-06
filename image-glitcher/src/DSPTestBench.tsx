import { saveAs } from 'file-saver';
import { DelaySettings } from './ImageProcessor';

export class DSPTestBench
{
    downloadUrl : string = "";

    processAudioBuffer(buffer : AudioBuffer, settings : any) //settings is AmpModSettings
    {
        let leftSamples = buffer.getChannelData(0);
        let rightSamples = buffer.getChannelData(1);

        let leftSamplesProcessed = this.bufferProcess(leftSamples, settings);
        let rightSamplesProcessed = this.bufferProcess(rightSamples, settings);

        return this.saveAsWavFile(leftSamplesProcessed, rightSamplesProcessed);
    }

    //modify this method to test new DSP
    private bufferProcess(samples : Float32Array, settings : DelaySettings)
    {
        this.delayPrepareToProcess(settings);

        let processedBuffer = [];
        for (let i = 0; i < samples.length; i++) 
        {
            const sample = samples[i];
            
            let processedSample = this.delayProcessSample(sample, settings);//this.ampModProcessSample(sample, i, settings);
            processedBuffer.push(processedSample);
        }

        console.log(processedBuffer)

        return new Float32Array(processedBuffer);
    }

    ampModProcessSample(sampleToProcess : number, sampleIndex : number, ampModSettings : AmpModSettings)
    {
        let angle = ampModSettings.phase + sampleIndex * ampModSettings.frequency;
        let coef = ampModSettings.offset + Math.sin(angle) * ampModSettings.amp;

        return sampleToProcess * coef;
    }

    m_indexRead = 0;
    m_indexWrite = 0;
    m_delayBuffer : number[] = [];

    delayPrepareToProcess(delaySettings : DelaySettings)
    {
        //set the circular buffer to fit the length of the delay exactly, fill it with zeros
        this.m_delayBuffer = new Array(delaySettings.delay).fill(0);
    }

    delayProcessSample(sampleToProcess : number, delaySettings : DelaySettings)
    {
        //find theoretical read index (with decimal points)
        this.m_indexRead = this.m_indexWrite - delaySettings.delay;

        //wrap the read index to start of array if necessary
        if (this.m_indexRead < 0)
            this.m_indexRead += this.m_delayBuffer.length;

        //find two nearest indexes
        let m_indexRead1 = Math.floor(this.m_indexRead);

        //click remover part 1
        if (this.m_indexRead == this.m_delayBuffer.length)
        {
            m_indexRead1 -= 1;
        }

        let m_indexRead2 = m_indexRead1 + 1;
        if (m_indexRead2 >= this.m_delayBuffer.length)
            m_indexRead2 -= this.m_delayBuffer.length;

        let m_distanceWeighting = 0;

        //find distance weighting & click remover part 2
        if (this.m_indexRead == this.m_delayBuffer.length)
        {
            m_distanceWeighting = 1.0;
        }
        else
            m_distanceWeighting = this.m_indexRead % 1;

        //read the input, xn, from the incoming sample
        let xn = sampleToProcess;

        //read the output, yn, from the circular buffer at the read position
        let yn1 = this.m_delayBuffer[m_indexRead1];
        let yn2 = this.m_delayBuffer[m_indexRead2];

        let yn = yn2*m_distanceWeighting + yn1*(1 - m_distanceWeighting);

        //write the current input sample, plus some feedback of the output sample to m_sampleToWrite
        //process m_sampleToWrite so it stays between 1 and -1
        //write sample into the circular buffer at the write position
        let m_sampleToWrite = xn + yn*delaySettings.feedback;
        m_sampleToWrite = this.clipSample(m_sampleToWrite);

        this.m_delayBuffer[this.m_indexWrite] = m_sampleToWrite;

        //increment the write index, wrapping the index back to the top of 
        //the circular buffer if necessary
        this.m_indexWrite++;
        if (this.m_indexWrite >= this.m_delayBuffer.length)
            this.m_indexWrite = 0;

        //set the incoming sample with the correct amounts of input and output
        //based on the wet/dry mix

        return delaySettings.mix*yn + (1.0 - delaySettings.mix)*xn;
    }

    private clipSample(sample : number)
    {
        if (sample > 1) return 1;

        if (sample < -1) return -1;

        return sample;
    }

    private saveAsWavFile(left : Float32Array, right : Float32Array)
    {
        //interleaved
        const interleaved = new Float32Array(left.length + right.length)
        for (let src=0, dst=0; src < left.length; src++, dst+=2) 
        {
            interleaved[dst] =   left[src]
            interleaved[dst+1] = right[src]
        }

        // get WAV file bytes and audio params of your audio source
        const wavBytes = this.getWavBytes(interleaved.buffer, 
        {
            isFloat: true,       // floating point or 16-bit integer
            numChannels: 2,
            sampleRate: 44100,
        });

        const wav = new Blob([wavBytes], { type: 'audio/wav' });

        if(this.downloadUrl != "")
            URL.revokeObjectURL(this.downloadUrl);
        this.downloadUrl = URL.createObjectURL(wav);

        return this.downloadUrl;
    }

    //returns Uint8Array of WAV bytes
    getWavBytes(buffer : ArrayBufferLike, options : any) 
    {
        const type = options.isFloat ? Float32Array : Uint16Array
        const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT
    
        const headerBytes = this.getWavHeader(Object.assign({}, options, { numFrames }))
        const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);
    
        // prepend header, then add pcmBytes
        wavBytes.set(headerBytes, 0)
        wavBytes.set(new Uint8Array(buffer), headerBytes.length)
    
        return wavBytes
    }
  
    // adapted from https://gist.github.com/also/900023
    // returns Uint8Array of WAV header bytes
    getWavHeader(options : any) 
    {
        const numFrames =      options.numFrames
        const numChannels =    options.numChannels || 2
        const sampleRate =     options.sampleRate || 44100
        const bytesPerSample = options.isFloat? 4 : 2
        const format =         options.isFloat? 3 : 1
    
        const blockAlign = numChannels * bytesPerSample
        const byteRate = sampleRate * blockAlign
        const dataSize = numFrames * blockAlign
    
        const buffer = new ArrayBuffer(44)
        const dv = new DataView(buffer)
    
        let p = 0
    
        function writeString(s : string) 
        {
            for (let i = 0; i < s.length; i++) 
            {
                dv.setUint8(p + i, s.charCodeAt(i))
            }
            p += s.length
        }
    
        function writeUint32(d : number) 
        {
            dv.setUint32(p, d, true)
            p += 4
        }
    
        function writeUint16(d : number) 
        {
            dv.setUint16(p, d, true)
            p += 2
        }
    
        writeString('RIFF')              // ChunkID
        writeUint32(dataSize + 36)       // ChunkSize
        writeString('WAVE')              // Format
        writeString('fmt ')              // Subchunk1ID
        writeUint32(16)                  // Subchunk1Size
        writeUint16(format)              // AudioFormat
        writeUint16(numChannels)         // NumChannels
        writeUint32(sampleRate)          // SampleRate
        writeUint32(byteRate)            // ByteRate
        writeUint16(blockAlign)          // BlockAlign
        writeUint16(bytesPerSample * 8)  // BitsPerSample
        writeString('data')              // Subchunk2ID
        writeUint32(dataSize)            // Subchunk2Size
    
        return new Uint8Array(buffer)
    }
}