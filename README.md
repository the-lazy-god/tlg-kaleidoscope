# TLG Kaleidoscope
Create a kaleidoscope effect on your web page using the Three.js library. This script transforms images into an interactive kaleidoscope pattern with customizable segments and motion.

## 🔗 Snippet

Copy the `<script>` below and paste it in the `<head>` or before `</body>` tag in your project on the pages where you need it. It also works with any newer version of three.js.

```html
<!-- Snippets by The Lazy God • Kaleidoscope -->
<script defer src="https://cdn.jsdelivr.net/npm/three-js@79.0.0/three.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-lazy-god/tlg-kaleidoscope@v1.0.0/tlg-kaleidoscope.min.js"></script
``` 

## ✅ Required Setup

### 1: Define canvas container(s)

Add the attribute below to any div element you want to contain a kaleidoscope effect.

**Note:** Set this element to `position:relative;` and give it the size you want the kaleidoscope canvas to be.

**Attribute:**

-   Name: `tlg-kaleidoscope-canvas`

### 2: Define image source element(s)

Within each canvas container, include one or more image elements with the attribute `tlg-kaleidoscope-image`. These images will be used in the kaleidoscope pattern. If more than one image element is used a random will be chosen on page load. 

**Note:** Use square images to avoid stretching. Hide the source images with `display:none;`.

**Attribute:**

-   Name: `tlg-kaleidoscope-image`

## 🔄 Optional Customization

### Set the number of segments

Control the number of segments in the kaleidoscope by adding the `tlg-kaleidoscope-segments` attribute to the container with attribute `tlg-kaleidoscope-canvas`. 

Default is 6 segments.

**Attribute (Optional):**

-   Name: `tlg-kaleidoscope-segments`
-   Value: `{number}` (Default = 6)

### Set texture scaling

Control the scale of the kaleidoscope texture by adding the `tlg-kaleidoscope-scale` attribute to the container with attribute `tlg-kaleidoscope-canvas`. 

Default is 1. Larger number will increase the size of each image tile.

**Attribute (Optional):**

-   Name: `tlg-kaleidoscope-scale`
-   Value: `{number}` (Default = 1)

### Set level of motion

Control the intensity of the motion effect based on mouse movement by adding the `tlg-kaleidoscope-motion` attribute to the container with attribute `tlg-kaleidoscope-canvas`. 

Default is 1. Larger number will increase motion intensity. Set the value to 0 to disable motion completely.

**Attribute (Optional):**

-   Name: `tlg-kaleidoscope-motion`
-   Value: `{number}` (Default = 1)

## 📦 Attributes overview

| Name                         | Description                                                                       | Values                      | Default |
|------------------------------|-----------------------------------------------------------------------------------|-----------------------------|---------|
| `tlg-kaleidoscope-canvas`    | Identifies the container element for the kaleidoscope canvas. **Required**        | None                        | -       |
| `tlg-kaleidoscope-image`     | Marks an image to be used in the kaleidoscope pattern. **Required**               | None                        | -       |
| `tlg-kaleidoscope-scale`     | Sets the scale factor of the kaleidoscope pattern.                                | {Number}                    | 1       |
| `tlg-kaleidoscope-motion`    | Controls the intensity of the motion effect based on mouse movement.              | {Number}                    | 1       |
| `tlg-kaleidoscope-segments`  | Determines the number of segments in the kaleidoscope pattern.                    | {Number}                    | 6       |

