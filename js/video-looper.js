import {LitElement, html} from 'lit-element';
import {classMap} from 'lit-html/directives/class-map.js';
import {debounce} from './tools';
import {play as playIcon, pause as pauseIcon, locked as lockedIcon, unlocked as unlockedIcon, muted as mutedIcon, sound as soundIcon, fullScreen as fullScreenIcon, exitFullScreen as exitFullScreenIcon} from './icons';

class VideoLooper extends LitElement {

    render() {

        return html`
        <style>
            
            :host {

                display: grid;
                flex-direction: column;
                
                --blue:rgba(0,179,255,0.4);
                --white:#ffffff;
                --red: rgba(230,78,65,0.6);
                --thumb-border-radius: 0;

                --track-height: 10px;
                --thumb-height: 23px;
                --thumb-width: 1px;
                --thumb-color: var(--white);
                --track-progress-color: var(--blue);
                --track-color: rgba(255, 255, 255, .2);
                --track-border-radius: 10px;
                --value: 50%;
                --thumb-box-shadow: 0 0 2px rgba(0,0,0,.7);

            }

            input[type=range] {
              -webkit-appearance: none;
              background-color: transparent;
            }
            
            input[type=range]:focus {
              outline: 0;
            }
            
            input[type=range]::-moz-focus-outer {
              border: 0;
            }
            
            input[type=range]:focus {
              outline: none;
            }
            
            input[type=range]::-webkit-slider-runnable-track {
              height: var(--track-height);
              border-radius: var(--track-border-radius);
              background:0 0;
              background-image: linear-gradient(90deg, var(--track-progress-color) var(--value), var(--track-color) var(--value));  
            }
            
            input[type=range]::-moz-range-track {
              height: var(--track-height);
              border-radius: var(--track-border-radius);
              background:0 0;
              background-image: linear-gradient(90deg, var(--track-progress-color) var(--value), var(--track-color) var(--value));
            }
            
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                display: block;
                width: var(--thumb-width);
                height: var(--thumb-height);
                border-radius: var(--thumb-border-radius);
                background-color: var(--thumb-color);
                top: calc(-1 * ((var(--thumb-height) / 2)) + (var(--track-height) / 2));
                position: relative;
            }
            
            input[type=range]::-moz-range-thumb {
                -webkit-appearance: none;
                display: block;
                width: var(--thumb-width);
                height: var(--thumb-height);
                border-radius: var(--thumb-border-radius);
                background-color: var(--thumb-color);
                top: calc(-1 * ((var(--thumb-height) / 2)) + (var(--track-height) / 2));
                position: relative;
            }

            #container {
                position: relative;
                overflow: hidden;
                background-color: #000;
            }

            video {
                width: 100%;
                height: 100%;

                /*https://stackoverflow.com/a/8600771*/
                vertical-align: top;
            }

            #controls {
                background: linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.7));
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 10px;
                display: flex;
                opacity: 0;
                pointer-events: none;    
                transition: all .3s linear;
                flex-wrap: nowrap;
                transform: translateY(100%);
            }
            
            .show-controls #controls,
            #controls:hover {
                opacity: 1;
                pointer-events: all;
                transform: translateY(0);
            }
            
            #controls input {
                width: 100%;
            }

            .icon {
                display: inline-block;
                width: 1em;
                height: 1em;
                line-height: 0;
                padding: 0;
                vertical-align: middle;
            }
            
            button {
                margin: 0;
                border: 0;
                border-radius: 3px;
                color: inherit;
                cursor: pointer;
                flex-shrink: 0;
                overflow: visible;
                padding: 10px;
                position: relative;
                transition: all .3s ease;
                -webkit-appearance: button;
                font: inherit;
                line-height: inherit;
                width: auto;
                background: transparent;
                fill: var(--white);
                outline: none;
                touch-action: manipulation;
                margin-right: 10px;
            }
            
            button:hover {
                background: var(--blue);
            }

            #progress-container {
                flex: 1;
                display: flex;
                height: 40px;
                position: relative;
            }

            #loop-area {
                background-color: var(--red);
                height: 10px;
                position: absolute;
                top: 15px;
                pointer-events: none;
            }

            #controls #volume {
                width: 70px;
                --thumb-width: 23px;
                --thumb-border-radius: 50%;
            }

            .exit-full-screen-icon {
                display: none;
            }
            
            :fullscreen .exit-full-screen-icon {
                display: inline-block;
            }

            :fullscreen .full-screen-icon {
                display: none;
            }

        </style>
        <div id="container" @mousemove="${() => this._mouseMoveHandler()}" class="${classMap({'show-controls': this._showControls})}">
            <video
                autoplay
                muted
                loop
                allowfullscreen
                src="${this.src}"
                .playbackRate="${this.playbackRate}"
                .volume="${this.volume}"
                @play="${() => this._videoPlayHandler()}"
                @pause="${() => this._videoPauseHandler()}"
                @click="${() => this.togglePlayState()}"
            ></video>
            <div id="controls" @click="${e => e.stopPropagation()}">
                <button @click="${() => this.togglePlayState()}"><span class="icon">${this._getStateIcon()}</span></button>
                <div id="progress-container">
                    ${this._getHighlightedSection()}
                    <input id="progress" type="range" min="0" max="100" step="0.01" .value="${this._progressSliderValue}" autocomplete="off" @input="${e => this._progressInputHandler(e)}" @change="${e => this._progressChangeHandler(e)}">
                </div>
                <button @click="${() => this._toggleRestrictedMode()}"><span class="icon">${this._getRestrictedIcon()}</span></button>
                <button @click="${() => this._toggleMuteMode()}"><span class="icon">${this._getSoundIcon()}</span></button>
                <input id="volume" type="range" min="0" max="1" step="0.05" .value="${this._volumeSliderValue}" autocomplete="off" @input="${e => this._volumeInputHandler(e)}">
                <button @click="${() => this._fullScreenRequest()}"><span class="icon full-screen-icon">${fullScreenIcon}</span><span class="icon exit-full-screen-icon">${exitFullScreenIcon}</span></button>
            </div>
        </div>
        `;

    }

    _fullScreenRequest() {

        if (document.fullscreenElement) {

            document.exitFullscreen();

        } else {

            this._container.requestFullscreen();

        }

    }

    _mouseMoveHandler() {

        this._showControls = true;
        this._mouseMoveEndedHandler();

    }

    _mouseMoveEndedHandler() {

        console.log('_mouseMoveEndedHandler');
        this._showControls = false;

    }

    _getSoundIcon(){

        let markup;

        if (this.muted) {

            markup = html`${mutedIcon}`;

        } else {

            markup = html`${soundIcon}`;

        }

        return markup;

    }

    _getHighlightedSection() {

        let markup;

        if (this.duration && typeof this.start === 'number' && typeof this.end === 'number') {
            const left = (this.start * 100) / this.duration;
            const end = (this.end * 100) / this.duration;
            const width = end - left;

            markup = html`<div id="loop-area" style="left:${left}%;width:${width}%;"></div>`;

        }

        return markup;

    }

    _getRestrictedIcon() {

        let markup;

        if (this.restricted) {
            markup = lockedIcon;
        } else {
            markup = unlockedIcon;
        }

        return markup;

    }

    _toggleMuteMode() {

        if (this.muted) {

            const volume = this._preMuteVolumeLevel || 0;
            this._setMuteState(false);
            this._setVolumeSliderValue(volume);
            delete this._preMuteVolumeLevel;

        } else {

            this._preMuteVolumeLevel = this.volume;
            this._setMuteState(true);

        }

    }

    _toggleRestrictedMode() {

        this.restricted = !this.restricted;

    }

    _getStateIcon() {

        let markup;

        if (this._state === 'playing') {
            markup = playIcon;
        } else {
            markup = pauseIcon;
        }

        return markup;

    }

    togglePlayState() {

        if (this._state === 'playing') {
            this.pause();
        } else {
            this.play();
        }

    }

    _videoPauseHandler() {
        this._state = 'pause';
    }

    _videoPlayHandler() {
        this._state = 'playing';
    }

    play() {
        this._state = 'playing';
        this._video.play();
    }

    pause() {
        this._state = 'pause';
        this._video.pause();
    }

    _progressChangeHandler(e) {

        this._video.currentTime = (parseFloat(e.target.value) * this.duration) / 100;
        this._setProgressSliderValue(e.target.value);

        if (this._previousState === 'playing') {
            this.play();
        }

        delete this._previousState;

    }

    _volumeInputHandler(e) {

        this._setVolumeSliderValue(parseFloat(e.target.value));

    }

    _progressInputHandler(e) {

        this._previousState = this._previousState || this._state;
        this.pause();
        this._setProgressSliderValue(e.target.value);

    }

    _setVolumeSliderValue(value) {

        this._volumeSlider.style.setProperty('--value', `${value * 100}%`);
        this._volumeSliderValue = value;
        this.volume = value;

        if (this.volume > 0 && this.muted) {

            this._setMuteState(false);

        } else if (this.volume === 0 && !this.muted) {

            this._setMuteState(true);

        }

    }

    _setProgressSliderValue(value) {

        this._progress.style.setProperty('--value', `${value}%`);
        this._progressSliderValue = value;

    }

    constructor() {

        super();
        this.autoplay = false;
        this.muted = false;
        this.loop = false;
        this.allowfullscreen = false;
        this.controls = false;
        this.playbackRate = 1;
        this.volume = 0;
        this.restricted = true;
        this._state = 'pause';
        this._showControls = false;

        this._checkProgress = this._checkProgress.bind(this);
        this._mouseMoveEndedHandler = debounce(this._mouseMoveEndedHandler.bind(this), 3000);

    }

    _checkProgress() {

        //@see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState#Value
        if(this._video.readyState > 0) {

            if (this.restricted && (this._video.currentTime < this.start || this._video.currentTime >= this.end)) {
                this._video.currentTime = this.start;
            }

            this.duration = this._video.duration;

            if (this._state === 'playing') {
                this._setProgressSliderValue((this._video.currentTime * 100) / this.duration); //moves the slider's progress track
            }

        } else {

            this._setProgressSliderValue(0);

        }

        window.requestAnimationFrame(this._checkProgress);

    }

    _setMuteState(shouldMute) {

        if (shouldMute) {

            this._video.muted = true;
            this.muted = true;
            this._setVolumeSliderValue(0);

        } else {

            this._video.muted = false;
            this.muted = false;

        }

    }

    firstUpdated(_changedProperties) {

        super.firstUpdated(_changedProperties);

        this._video = this.shadowRoot.querySelector('video');
        this._progress = this.shadowRoot.querySelector('#progress');
        this._volumeSlider = this.shadowRoot.querySelector('#volume');
        this._container = this.shadowRoot.querySelector('#container');

        this._setProgressSliderValue(0);
        this._setVolumeSliderValue(this.volume);

        ['autoplay', 'loop', 'allowfullscreen', 'controls'].forEach(attribute => {

            if (this[attribute] === false) {
                this._video.removeAttribute(attribute);
                this._video[attribute] = false;
            }

        });

        window.requestAnimationFrame(this._checkProgress);

    }

    static get properties() {

        return {
            src: {type: String},
            autoplay: {type: Boolean},
            muted: {type: Boolean},
            loop: {type: Boolean},
            allowfullscreen: {type: Boolean},
            controls: {type: Boolean},
            start: {type: Number},
            end: {type: Number},
            playbackRate: {type: Number},
            currentTime: {type: Number},
            _progressSliderValue: {type: Number},
            _state: {type: String},
            restricted: {type: Boolean},
            volume: {type: Number},
            _volumeSliderValue: {type: Number},
            _showControls: {type: Boolean}
        };

    }

}

window.customElements.define('video-looper', VideoLooper);
