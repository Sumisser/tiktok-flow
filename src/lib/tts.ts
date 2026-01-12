export interface TtsRequest {
  text: string;
  voice_id: string;
  speed?: number;
  vol?: number;
  pitch?: number;
  emotion?: string;
}

export interface Voice {
  id: string;
  name: string;
  desc: string;
  type: string;
}

export async function generateMinimaxTts(req: TtsRequest) {
  const apiKey = import.meta.env.VITE_MINIMAX_KEY;
  const groupId = import.meta.env.VITE_MINIMAX_GROUP_ID;
  if (!apiKey) {
    throw new Error('Missing VITE_MINIMAX_KEY');
  }

  const url = groupId
    ? `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`
    : 'https://api.minimax.chat/v1/t2a_v2';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'speech-02-hd',
      text: req.text,
      stream: false,
      timbre_weights: [
        {
          voice_id: req.voice_id || 'Boyan_new_platform',
          weight: 100,
        },
      ],
      voice_setting: {
        voice_id: '', // 留空，使用 timbre_weights
        speed: req.speed || 1,
        vol: req.vol || 1,
        pitch: req.pitch || 0,
        latex_read: false,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
      language_boost: 'auto',
    }),
  });

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const jsonData = await response.json();

    // 处理正常的 JSON 响应（包含十六进制音频数据）
    if (jsonData.data?.audio) {
      const hex = jsonData.data.audio;
      const match = hex.match(/.{1,2}/g);
      if (!match) throw new Error('音频数据格式错误');
      const uint8Array = new Uint8Array(
        match.map((byte: string) => parseInt(byte, 16)),
      );
      const blob = new Blob([uint8Array], { type: 'audio/mp3' });
      return URL.createObjectURL(blob);
    }

    // 处理正常的 JSON 响应（包含 Base64 格式，以防万一）
    if (jsonData.data?.audio_base64) {
      const binary = atob(jsonData.data.audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      return URL.createObjectURL(blob);
    }

    throw new Error(jsonData.base_resp?.status_msg || 'TTS 接口返回错误');
  }

  if (!response.ok) {
    throw new Error(`TTS 请求失败: ${response.status}`);
  }

  const blob = await response.blob();
  if (blob.size < 1000) {
    const text = await blob.text();
    if (text.includes('base_resp')) {
      const err = JSON.parse(text);
      throw new Error(err.base_resp?.status_msg || '合成失败');
    }
  }

  return URL.createObjectURL(blob);
}

export async function fetchMinimaxVoices(): Promise<Voice[]> {
  const apiKey = import.meta.env.VITE_MINIMAX_KEY;
  if (!apiKey) return MINIMAX_VOICES;

  try {
    const response = await fetch('https://api.minimaxi.com/v1/get_voice', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voice_type: 'all' }),
    });

    if (!response.ok) return MINIMAX_VOICES;
    const data = await response.json();

    const allVoices: Voice[] = [];

    // 系统音色
    if (data.system_voice) {
      data.system_voice.forEach((v: any) => {
        allVoices.push({
          id: v.voice_id,
          name: v.voice_name || v.voice_id,
          desc: v.description?.[0] || '系统内置优质音色',
          type: '系统',
        });
      });
    }

    // 克隆音色
    if (data.voice_cloning) {
      data.voice_cloning.forEach((v: any) => {
        allVoices.push({
          id: v.voice_id,
          name: v.voice_name || `克隆音色-${v.voice_id.slice(-4)}`,
          desc: `创建于 ${v.created_time || '未知时间'}`,
          type: '克隆',
        });
      });
    }

    // 生成音色
    if (data.voice_generation) {
      data.voice_generation.forEach((v: any) => {
        allVoices.push({
          id: v.voice_id,
          name: v.voice_name || `生成的音色-${v.voice_id.slice(-4)}`,
          desc: `创建于 ${v.created_time || '未知时间'}`,
          type: '生成',
        });
      });
    }

    // 兼容之前的 data.data.voices 字段
    if (data.data?.voices) {
      data.data.voices.forEach((v: any) => {
        if (!allVoices.find((ex) => ex.id === v.voice_id)) {
          allVoices.push({
            id: v.voice_id,
            name: v.voice_name || v.voice_id,
            desc: v.gender === 'male' ? '男声' : '女声',
            type: '其他',
          });
        }
      });
    }
    return allVoices.length > 0 ? allVoices : MINIMAX_VOICES;
  } catch (e) {
    console.error('Fetch voices error:', e);
  }
  return MINIMAX_VOICES;
}

export const MINIMAX_VOICES: Voice[] = [
  {
    id: 'Boyan_new_platform',
    name: '专业播音',
    desc: '标准普通话播音员',
    type: '系统',
  },
  {
    id: 'male-qn-qingse',
    name: '青涩青年',
    desc: '阳光活力男声',
    type: '系统',
  },
  { id: 'female-shaonv', name: '活力少女', desc: '甜美可爱女声', type: '系统' },
  { id: 'female-yujie', name: '知性御姐', desc: '成熟稳重女声', type: '系统' },
  {
    id: 'Chinese (Mandarin)_Reliable_Executive',
    name: '沉稳高管',
    desc: '可靠中年男声',
    type: '系统',
  },
];
