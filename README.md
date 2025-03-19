# ImmichToJellyFin

A tool that extracts albums from [Immich](https://github.com/immich-app/immich) and downloads their assets into a seperate folders for other applications like [Jellyfin](https://github.com/jellyfin/jellyfin) to display.

1. Get a list of albums
1. For each album a list of assets are retrieved
1. Assets are then downloaded
1. Images are downloaded as compressed versions whereas videos are the original versions
1. It doesn't redownload files it already has

## Installation

```bash
npm install
```
1. Create a .env from .env.example and populate the values

## Usage

```bash
npm run start
```

This can be triggered on a schedule using scheduled tasks in windows and the batch file.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
