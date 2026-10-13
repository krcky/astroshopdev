package rs.astroshop.nebo.sat

import android.graphics.Bitmap
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import rs.astroshop.nebo.core.buildSky
import java.io.ByteArrayOutputStream

/**
 * Plocica (Tile): krug neba kao slika, nacrtan na satu. Sistem je trazi iznova na
 * 15 minuta; verzija resursa je to vreme, pa se slika tada i zameni.
 */
class NeboPlocica : TileService() {
    private fun cetvrt() = System.currentTimeMillis() / KORAK_MS * KORAK_MS

    override fun onTileRequest(request: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val slika = LayoutElementBuilders.Image.Builder()
            .setResourceId(SLIKA).setWidth(expand()).setHeight(expand())
            .setContentScaleMode(LayoutElementBuilders.CONTENT_SCALE_MODE_FIT)
            .build()
        return Futures.immediateFuture(
            TileBuilders.Tile.Builder()
                .setResourcesVersion(cetvrt().toString())
                .setFreshnessIntervalMillis(KORAK_MS)
                .setTileTimeline(TimelineBuilders.Timeline.fromLayoutElement(slika))
                .build())
    }

    override fun onTileResourcesRequest(request: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> {
        val bitmapa = Slike.krug(buildSky(cetvrt(), Mesto.procitaj(this)), 384)
        val png = ByteArrayOutputStream().also { bitmapa.compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()
        return Futures.immediateFuture(
            ResourceBuilders.Resources.Builder()
                .setVersion(request.version)
                .addIdToImageMapping(SLIKA, ResourceBuilders.ImageResource.Builder()
                    .setInlineResource(ResourceBuilders.InlineImageResource.Builder()
                        .setData(png).setWidthPx(384).setHeightPx(384)
                        // Bez formata = sabijena slika (PNG), sistem je sam otpakuje.
                        .setFormat(ResourceBuilders.IMAGE_FORMAT_UNDEFINED)
                        .build())
                    .build())
                .build())
    }

    companion object {
        private const val SLIKA = "krug"
        private const val KORAK_MS = 15 * 60 * 1000L
    }
}
