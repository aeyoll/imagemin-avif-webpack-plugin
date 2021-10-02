# imagemin-avif-webpack-plugin


**Webpack** plugin which converts images to the [Avif](https://developers.google.com/speed/webp/) format while also keeping the original files. Compatible with **webpack 5**, **webpack 4** and previous versions as well.


It uses [imagemin](https://www.npmjs.com/package/imagemin), [imagemin-avif](https://www.npmjs.com/package/imagemin-avif) under the hood.

Shoutout to @iampava and its [imagemin-webp-webpack-plugin](https://github.com/iampava/imagemin-webp-webpack-plugin), which this repo is based on.


## Motivation

A modern image format based on the AV1 video format. AVIF generally has better compression than WebP, JPEG, PNG and GIF and is designed to supersede them. AVIF competes with JPEG XL which has similar compression quality and is generally seen as more feature-rich than AVIF.

Check the support tables on [Can I use](https://caniuse.com/#feat=avif)


## Installation



```bash
$ npm install imagemin-avif-webpack-plugin --save-dev
```



## Usage



In order to use this plugin, add it to your **webpack config**.



```js
const ImageminAvifWebpackPlugin= require("imagemin-avif-webpack-plugin");

module.exports = {
    plugins: [new ImageminAvifWebpackPlugin()]
};
```
⚠ Keep in mind that plugin order matters, so usually you'd want to put it last.



## API



### ```new ImageminAvifWebpackPlugin( [settings] );```



### settings



Type: `Object`<br/>

Default:

```js
{
  config: [{
    test: /\.(jpe?g|png)/,
    options: {
      quality:  75
    }
  }],
  overrideExtension: true,
  detailedLogs: false,
  silent: false,
  strict: true
}
```

#### config
Type ```Array<Object: {test, options} >```


The main config of the plugin which controls how different file types are converted. Each item in the array is an object with 2 properties:

* **test** - a RegExp selecting just certain images. Supported image formats are **JPG**, **PNG** and **GIF**.
* **options** -the converting options for the images that pass the above RegExp

⚠ The **options** object is actually the same one from the [imagemin-avif](https://www.npmjs.com/package/imagemin-avif) plugin so check their documentation for the available settings.

#### overrideExtension

Type: `boolean`<br>
Default: `true`

By default the plugin will override the original file extension, so you will get: `image.png` -> `image.avif`

In case you want to concat '.avif' at the end of the file name, set the config value to false. Ex: `image.png` -> `image.png.avif`. It may be useful when using nginx or similar to serve .avif files, if http-accept header contains avif just add a suffix to the requested image.

#### detailedLogs

Type: `boolean`<br>
Default: `false`

By default the plugin will print to the console

1. the total number of megabytes saved by the avif images compared to the original ones
2. the number of images that failed being converted

This options tells the plugin to also log the size difference per converted image and the names of the images that failed conversion.

#### silent

Type: `boolean`<br>
Default: `false`

In case you don't want anything printed to the console set this option to false. This will override the `detailedLogs` option. <br>

#### strict

Type: `boolean`<br>
Default: `true`

By default the webpack build will fail if any of the images that match your RegExps fail the conversion.

This option tells the plugin to not crash the build and keep going :)
