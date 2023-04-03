import React from 'react';
import shaka from 'shaka-player';

class VideoPlayer extends React.PureComponent {
	videoComponent: React.RefObject<HTMLVideoElement>;

	constructor(props: {} | Readonly<{}>){

		super(props);

		this.videoComponent = React.createRef();

		this.onErrorEvent = this.onErrorEvent.bind(this);

		this.onError = this.onError.bind(this);
	}

	onErrorEvent(event: { detail: any; }) {
	  // Extract the shaka.util.Error object from the event.
	  this.onError(event.detail);
	}

	onError(error: { code: any; }) {
	  // Log the error.
	  console.error('Error code', error.code, 'object', error);
	}

	componentDidMount(){

		var manifestUri = 'https://d3ezbh7ttypwmz.cloudfront.net/560ffd76-9dc5-495d-b030-7e855c3de517/dash/manifest.mpd';

		const video = this.videoComponent.current;

		var player = new shaka.Player(video);

		// Listen for error events.
  		player.addEventListener('error', this.onErrorEvent);

        player.getNetworkingEngine()?.registerRequestFilter(function(type, request) {
          if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
			type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
				request.uris[0] += "?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kM2V6Ymg3dHR5cHdtei5jbG91ZGZyb250Lm5ldC81NjBmZmQ3Ni05ZGM1LTQ5NWQtYjAzMC03ZTg1NWMzZGU1MTcvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY4MDYzNjgyM319fV19&Key-Pair-Id=K4TSNEKDNQM66&Signature=yQy8DL1SUYqNx42zEr71yzlWj4xLwOxs~WRk7NrfTZdrT4-DvUsEgCbaZgCWIh6Ur0-ZCV5njCO9P02ga4z3rlefRxUzb9G9fWj-qazYcMCaBKlcn7elqanu1kW2hpKwPU8rgX0ZnGnX2dbedfMirVe3RhMYfeLBciQuIc7CjbNis79aK8LZtmMtLHOtiSzvzU-8mzMTunqhl64OtJOAhBO1cHfpvy5ScT-ntSrebbYoGjJ~~~R2jHgD-rQNxjd5s~jzD7ljqdArgX94pv-mZLgqk6ml2EfzRXcUdJzQEiw57KNJER5kYkFGJ7FLDHP0kDZPuy2ZYObSbKik10RRiA__"
			}
		});

  		// Try to load a manifest.
	  	// This is an asynchronous process.
	  	player.load(manifestUri).then(function() {
		    // This runs if the asynchronous load is successful.
		    console.log('The video has now been loaded!');
			console.log(player.getAudioLanguages());
	  	}).catch(this.onError);  // onError is executed if the asynchronous load fails.

               
	}

	render(){	
		return (
				<video
					style={{width: '100vw', height: '100vh', objectFit: 'cover', maxWidth: '100%', maxHeight: '100%'}}
					ref={this.videoComponent}
					poster="//shaka-player-demo.appspot.com/assets/poster.jpg"
					controls
				/>
		);
	}
}

export default VideoPlayer;