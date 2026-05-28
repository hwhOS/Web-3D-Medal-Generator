import type { ExportFormat, MaterialPreset, MedalShape } from './domain/types';

export type Language = 'en' | 'zh';

type Copy = {
  documentTitle: string;
  language: string;
  controlAria: string;
  appTitle: string;
  appSubtitle: string;
  sections: Record<'shape' | 'dimensions' | 'svg' | 'back' | 'material', string>;
  shapes: Record<MedalShape, string>;
  fields: Record<
    | 'diameter'
    | 'width'
    | 'height'
    | 'thickness'
    | 'edgeBevel'
    | 'cornerRadius'
    | 'polygonSides'
    | 'quality'
    | 'frontSample'
    | 'reliefDepth'
    | 'scale'
    | 'rotation'
    | 'offsetX'
    | 'offsetY'
    | 'reliefColor'
    | 'reliefMetalness'
    | 'reliefRoughness'
    | 'text'
    | 'textSize'
    | 'markHeight'
    | 'textOffsetY'
    | 'showBackSvg'
    | 'backSample'
    | 'markColor'
    | 'markMetalness'
    | 'markRoughness'
    | 'svgWidth'
    | 'svgOffsetY'
    | 'baseColor'
    | 'baseMetalness'
    | 'baseRoughness',
    string
  >;
  upload: Record<'frontAria' | 'backAria' | 'noFront' | 'noBack' | 'removeSvg' | 'removeBackSvg' | 'noSample' | 'uploadedSample', string>;
  materials: Record<MaterialPreset, string>;
  reset: string;
  preview: Record<'eyebrow' | 'title' | 'hint', string>;
  exportPanel: {
    aria: string;
    status: Record<'idle' | 'generating' | 'ready' | 'error', string>;
    stats: Record<'triangles' | 'vertices' | 'volume' | 'surfaceArea', string>;
    details: Record<ExportFormat, string>;
    exporting: string;
    note: string;
  };
};

export const copy: Record<Language, Copy> = {
  en: {
    documentTitle: 'Medal Generator',
    language: 'Language',
    controlAria: 'Medal parameters',
    appTitle: 'Medal Generator',
    appSubtitle: 'SVG relief to 3D medal model',
    sections: {
      shape: 'Shape',
      dimensions: 'Dimensions',
      svg: 'SVG Relief',
      back: 'Back Text',
      material: 'Base Material'
    },
    shapes: {
      circle: 'Circle',
      oval: 'Oval',
      'rounded-rect': 'Rounded Rect',
      polygon: 'Polygon',
      shield: 'Shield'
    },
    fields: {
      diameter: 'Diameter',
      width: 'Width',
      height: 'Height',
      thickness: 'Thickness',
      edgeBevel: 'Edge Bevel',
      cornerRadius: 'Corner Radius',
      polygonSides: 'Sides',
      quality: 'Curve Quality',
      frontSample: 'Front Sample',
      reliefDepth: 'Relief Depth',
      scale: 'Scale',
      rotation: 'Rotation',
      offsetX: 'X Offset',
      offsetY: 'Y Offset',
      reliefColor: 'Relief Color',
      reliefMetalness: 'Relief Metalness',
      reliefRoughness: 'Relief Roughness',
      text: 'Text',
      textSize: 'Text Size',
      markHeight: 'Mark Height',
      textOffsetY: 'Text Y Position',
      showBackSvg: 'Show Small Back SVG',
      backSample: 'Back Sample',
      markColor: 'Text Color',
      markMetalness: 'Text Metalness',
      markRoughness: 'Text Roughness',
      svgWidth: 'SVG Width',
      svgOffsetY: 'SVG Y Position',
      baseColor: 'Color',
      baseMetalness: 'Metalness',
      baseRoughness: 'Roughness'
    },
    upload: {
      frontAria: 'Upload SVG artwork',
      backAria: 'Upload back SVG',
      noFront: 'No SVG selected',
      noBack: 'No back SVG selected',
      removeSvg: 'Remove SVG',
      removeBackSvg: 'Remove back SVG',
      noSample: 'None',
      uploadedSample: 'Uploaded file'
    },
    materials: {
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze',
      'black-nickel': 'Black Nickel',
      custom: 'Custom'
    },
    reset: 'Reset Parameters',
    preview: {
      eyebrow: 'Live Preview',
      title: '3D Medal Model',
      hint: 'Drag to rotate · Scroll to zoom'
    },
    exportPanel: {
      aria: 'Export model',
      status: {
        idle: 'Waiting to generate',
        generating: 'Generating model',
        ready: 'Model ready',
        error: 'Generation failed'
      },
      stats: {
        triangles: 'Triangles',
        vertices: 'Vertices',
        volume: 'Volume',
        surfaceArea: 'Surface Area'
      },
      details: {
        stl: '3D printing, millimeter units',
        glb: 'Preserves materials, meter units',
        usdz: 'Apple Quick Look / AR'
      },
      exporting: 'Exporting',
      note: 'STL does not preserve color or material; GLB/USDZ preserve the current metal material settings.'
    }
  },
  zh: {
    documentTitle: '奖牌生成器',
    language: '界面语言',
    controlAria: '奖牌参数',
    appTitle: '奖牌生成器',
    appSubtitle: 'SVG 浮雕到 3D 奖牌模型',
    sections: {
      shape: '形状',
      dimensions: '尺寸',
      svg: 'SVG 纹理',
      back: '背面刻字',
      material: '材质'
    },
    shapes: {
      circle: '圆形',
      oval: '椭圆',
      'rounded-rect': '圆角矩形',
      polygon: '多边形',
      shield: '盾形'
    },
    fields: {
      diameter: '直径',
      width: '宽度',
      height: '高度',
      thickness: '厚度',
      edgeBevel: '边缘倒角',
      cornerRadius: '圆角',
      polygonSides: '边数',
      quality: '曲线精度',
      frontSample: '正面样板',
      reliefDepth: '浮雕深度',
      scale: '缩放',
      rotation: '旋转',
      offsetX: '水平偏移',
      offsetY: '垂直偏移',
      reliefColor: '浮雕颜色',
      reliefMetalness: '浮雕金属度',
      reliefRoughness: '浮雕粗糙度',
      text: '文字',
      textSize: '文字大小',
      markHeight: '刻字高度',
      textOffsetY: '文字垂直位置',
      showBackSvg: '显示背面小 SVG',
      backSample: '背面样板',
      markColor: '刻字颜色',
      markMetalness: '刻字金属度',
      markRoughness: '刻字粗糙度',
      svgWidth: 'SVG 宽度',
      svgOffsetY: 'SVG 垂直位置',
      baseColor: '颜色',
      baseMetalness: '金属度',
      baseRoughness: '粗糙度'
    },
    upload: {
      frontAria: '上传 SVG 图像',
      backAria: '上传背面 SVG',
      noFront: '未选择 SVG 文件',
      noBack: '未选择背面 SVG',
      removeSvg: '移除 SVG',
      removeBackSvg: '移除背面 SVG',
      noSample: '不使用样板',
      uploadedSample: '已上传文件'
    },
    materials: {
      gold: '金色',
      silver: '银色',
      bronze: '铜色',
      'black-nickel': '黑镍',
      custom: '自定义'
    },
    reset: '重置参数',
    preview: {
      eyebrow: '实时预览',
      title: '3D 奖牌模型',
      hint: '拖拽旋转 · 滚轮缩放'
    },
    exportPanel: {
      aria: '导出模型',
      status: {
        idle: '等待生成',
        generating: '正在生成模型',
        ready: '模型已就绪',
        error: '生成失败'
      },
      stats: {
        triangles: '三角面',
        vertices: '顶点',
        volume: '体积',
        surfaceArea: '表面积'
      },
      details: {
        stl: '3D 打印，毫米单位',
        glb: '保留材质，米单位',
        usdz: 'Apple Quick Look / AR'
      },
      exporting: '导出中',
      note: 'STL 不保存颜色或材质；GLB/USDZ 会保留当前金属材质设置。'
    }
  }
};
