<template>
  <div id="home">

  </div>
</template>

<script>
import {SVG} from '@svgdotjs/svg.js';
import '@svgdotjs/svg.panzoom.js';
import axios from 'axios'
import MCad from "@/model/MCad";
import MRubber from '@/model/MRubber'
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'home',
  data() {
    return {
      viewBox: '',
      draw: ''
    }
  },
  async mounted() {
    axios.get('/test.json').then(async res => {
      let svgJsonData = res.data

      this.$store.commit('COMMIT_JSON', svgJsonData)
      this.draw = SVG().addTo('#home').size('100%', '100%').css({
        'background-color': '#dcdcdc'
      }).panZoom({
        wheelZoom: true,
        panning: true,
        zoomFactor: 1,
        panButton: 1,
        wheelZoomDeltaModeScreenPixels: 1,
        wheelZoomDeltaModeLinePixels: 1
      });
      this.viewBox = this.draw.viewbox(
          0,
          0,
          svgJsonData.maxX - svgJsonData.minX,
          svgJsonData.maxY - svgJsonData.minY ? svgJsonData.maxY - svgJsonData.minY : 100
      );
      this.cad = new MCad(this.draw, svgJsonData)
      this.rubber = new MRubber(this.draw, this.cad);
      await this.cad.render()
    })
  }
}

</script>

<style scoped>
#home {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #dcdcdc;
}

#home svg {
  background-color: #dcdcdc;
}
</style>
