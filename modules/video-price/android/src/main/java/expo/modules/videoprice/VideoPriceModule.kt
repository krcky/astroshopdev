package expo.modules.videoprice

import android.content.ContentValues
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.provider.MediaStore
import android.view.Surface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView
import java.io.File

/**
 * VIDEO DNEVNE PRICE — Android (Ivan, 30.9.2026). Isto kao iOS (`ios/VideoPriceModule.swift`):
 * React u `PlatnoVidea` crta karticu za deljenje; JS postavi sat animacija na trenutak kadra,
 * saceka da se kadar nacrta i pozove `kadar(redni)`. Ovde se pogled crta PRAVO u ulaznu
 * povrsinu hardverskog H.264 kodera (`MediaCodec` + `lockHardwareCanvas`), a `MediaMuxer`
 * slaze MP4. Sve je javni Android API; nista ne ide na mrezu.
 *
 * VREME KADRA: povrsina kodera kadrovima daje vreme telefona (kad je kadar predat), a mi crtamo
 * sporije nego sto video tece — zato se u MP4 upisuje vreme po REDU izlaza (n / fps). B-kadrova
 * nema (`KEY_MAX_B_FRAMES` 0), pa izlaz ide istim redom kao ulaz.
 */
class VideoPriceGreska(poruka: String) : CodedException(poruka)

class VideoPriceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VideoPrice")

    // "Sačuvaj u Fotografije": u galeriju (Movies/Astro Shop). Od Androida 10 bez ikakve dozvole
    // (aplikacija dodaje SVOJ fajl); na starijim JS dugme ni ne prikazuje (`MOZE_CUVANJE`).
    AsyncFunction("sacuvajUFotografije") { uri: String ->
      val context = appContext.reactContext ?: throw VideoPriceGreska("Nema konteksta")
      sacuvajUGaleriju(context, uri)
    }

    View(PlatnoVideaView::class) {
      AsyncFunction("pocni") { view: PlatnoVideaView, uri: String, sirina: Int, visina: Int, fps: Int, bitrate: Int ->
        view.pocni(uri, sirina, visina, fps, bitrate)
      }.runOnQueue(Queues.MAIN)

      // `nacin` postoji zbog iOS-a (dva nacina crtanja); Android ima jedan.
      AsyncFunction("kadar") { view: PlatnoVideaView, redni: Int, _: String ->
        view.kadar(redni)
      }.runOnQueue(Queues.MAIN)

      AsyncFunction("zavrsi") { view: PlatnoVideaView ->
        view.zavrsi()
      }.runOnQueue(Queues.MAIN)

      AsyncFunction("otkazi") { view: PlatnoVideaView ->
        view.otkazi()
      }.runOnQueue(Queues.MAIN)
    }
  }

  private fun sacuvajUGaleriju(context: Context, uri: String): String {
    val put = Uri.parse(uri).path ?: throw VideoPriceGreska("Putanja nije fajl: $uri")
    val fajl = File(put)
    if (!fajl.exists()) throw VideoPriceGreska("Nema fajla: $uri")
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) throw VideoPriceGreska("Android stariji od 10")
    val resolver = context.contentResolver
    val podaci = ContentValues().apply {
      put(MediaStore.Video.Media.DISPLAY_NAME, fajl.name)
      put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
      put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/Astro Shop")
      put(MediaStore.Video.Media.IS_PENDING, 1)
    }
    val cilj = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, podaci)
      ?: throw VideoPriceGreska("Galerija nije prihvatila video")
    try {
      resolver.openOutputStream(cilj)?.use { izlaz -> fajl.inputStream().use { it.copyTo(izlaz) } }
        ?: throw VideoPriceGreska("Galerija nije otvorila fajl")
      podaci.clear()
      podaci.put(MediaStore.Video.Media.IS_PENDING, 0)
      resolver.update(cilj, podaci, null, null)
    } catch (e: Exception) {
      resolver.delete(cilj, null, null)
      throw e
    }
    return "sacuvano"
  }
}

class PlatnoVideaView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var koder: MediaCodec? = null
  private var mux: MediaMuxer? = null
  private var povrsina: Surface? = null
  private var staza = -1
  private var muxRadi = false
  private var izlaz: File? = null
  private var fps = 30
  private var sirina = 1080
  private var visina = 1920
  /** Koliko je kadrova upisano u MP4 — od toga vreme kadra. */
  private var upisano = 0L
  private val info = MediaCodec.BufferInfo()

  init {
    // VoiceOver/TalkBack ne treba da nadje karticu koja se crta van ekrana.
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
  }

  // Decu rasporedjuje React; LinearLayout (ExpoView) bi ih inace slozio jedno ispod drugog.
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}

  fun pocni(uri: String, sirina: Int, visina: Int, fps: Int, bitrate: Int) {
    otkazi()
    val put = Uri.parse(uri).path ?: throw VideoPriceGreska("Putanja nije fajl: $uri")
    val fajl = File(put)
    fajl.delete()
    val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, sirina, visina).apply {
      setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
      setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
      setInteger(MediaFormat.KEY_FRAME_RATE, fps)
      setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 2)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) setInteger(MediaFormat.KEY_MAX_B_FRAMES, 0)
      // BT.709 kao svaki HD video — bez oznake plejeri pogadjaju boje.
      setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT709)
      setInteger(MediaFormat.KEY_COLOR_TRANSFER, MediaFormat.COLOR_TRANSFER_SDR_VIDEO)
      setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_LIMITED)
    }
    val k = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
    try {
      k.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      povrsina = k.createInputSurface()
      k.start()
      mux = MediaMuxer(fajl.path, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    } catch (e: Exception) {
      k.release()
      povrsina?.release()
      povrsina = null
      throw VideoPriceGreska("Koder nije pokrenut: ${e.message}")
    }
    koder = k
    izlaz = fajl
    this.fps = fps
    this.sirina = sirina
    this.visina = visina
    upisano = 0
    staza = -1
    muxRadi = false
  }

  fun kadar(redni: Int): Double {
    val t0 = SystemClock.elapsedRealtimeNanos()
    val s = povrsina ?: throw VideoPriceGreska("Video nije zapocet")
    if (width == 0 || height == 0) throw VideoPriceGreska("Platno nema meru")
    // Hardversko platno crta kao ekran (zaobljenja, senke); ako ga koder ne da, obicno.
    val platno: Canvas = try {
      s.lockHardwareCanvas()
    } catch (e: Exception) {
      s.lockCanvas(null)
    }
    try {
      platno.drawColor(Color.WHITE)
      platno.scale(sirina.toFloat() / width, visina.toFloat() / height)
      draw(platno)
    } finally {
      s.unlockCanvasAndPost(platno)
    }
    ocedi(false)
    return (SystemClock.elapsedRealtimeNanos() - t0) / 1_000_000.0
  }

  fun zavrsi(): String {
    val k = koder ?: throw VideoPriceGreska("Video nije zapocet")
    val fajl = izlaz ?: throw VideoPriceGreska("Video nije zapocet")
    k.signalEndOfInputStream()
    ocedi(true)
    if (!muxRadi || upisano == 0L) {
      oslobodi(obrisiFajl = true)
      throw VideoPriceGreska("Video je prazan")
    }
    oslobodi(obrisiFajl = false)
    return Uri.fromFile(fajl).toString()
  }

  fun otkazi() {
    oslobodi(obrisiFajl = true)
  }

  /** Pokupi sve sto je koder zavrsio i upisi u MP4. `kraj`: ceka do kraja toka (najvise ~5 s). */
  private fun ocedi(kraj: Boolean) {
    val k = koder ?: return
    val m = mux ?: return
    var cekanje = 0
    while (true) {
      val i = k.dequeueOutputBuffer(info, if (kraj) 10_000L else 0L)
      when {
        i == MediaCodec.INFO_TRY_AGAIN_LATER -> {
          if (!kraj || ++cekanje > 500) return
        }
        i == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
          if (!muxRadi) {
            staza = m.addTrack(k.outputFormat)
            m.start()
            muxRadi = true
          }
        }
        i >= 0 -> {
          val bafer = k.getOutputBuffer(i)
          val podesavanja = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
          if (bafer != null && info.size > 0 && !podesavanja && muxRadi) {
            bafer.position(info.offset)
            bafer.limit(info.offset + info.size)
            info.presentationTimeUs = upisano * 1_000_000L / fps
            upisano++
            m.writeSampleData(staza, bafer, info)
          }
          k.releaseOutputBuffer(i, false)
          if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
        }
      }
    }
  }

  private fun oslobodi(obrisiFajl: Boolean) {
    try { koder?.stop() } catch (_: Exception) {}
    try { koder?.release() } catch (_: Exception) {}
    try { if (muxRadi) mux?.stop() } catch (_: Exception) {}
    try { mux?.release() } catch (_: Exception) {}
    try { povrsina?.release() } catch (_: Exception) {}
    if (obrisiFajl) izlaz?.delete()
    koder = null
    mux = null
    povrsina = null
    izlaz = null
    muxRadi = false
    staza = -1
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    oslobodi(obrisiFajl = true)
  }
}
