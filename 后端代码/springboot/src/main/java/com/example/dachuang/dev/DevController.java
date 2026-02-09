package com.example.dachuang.dev;

import com.example.dachuang.common.api.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/dev")
@Profile("dev")
@RequiredArgsConstructor
public class DevController {

    private final BulkSeederService bulkSeederService;

    @PostMapping("/seed-large-data")
    public Result<String> seedLargeData(@RequestParam(defaultValue = "10") int count) {
        if (count > 500) {
            return Result.error(400, "Maximum 500 batches at once to prevent server/blockchain overload.");
        }

        // Run in background to avoid timeout
        CompletableFuture.runAsync(() -> {
            bulkSeederService.seedData(count);
        });
        return Result.success("Bulk seeding started for " + count + " batches. Check logs for progress.");
    }

    @PostMapping("/sync-blockchain")
    public Result<String> syncBlockchain() {
        CompletableFuture.runAsync(() -> {
            bulkSeederService.syncPendingBatches();
        });
        return Result.success("Blockchain sync started in background. Check logs for progress.");
    }
}
