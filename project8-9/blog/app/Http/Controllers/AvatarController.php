<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AvatarController extends Controller
{
    public function __construct(private readonly ImageService $images) {}

    public function store(Request $request)
    {
        $request->validate(['avatar' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:2048']]);
        $path = $this->images->store($request->file('avatar'), 'avatars', 512);
        $old = $request->user()->avatar_path;
        try {
            $request->user()->forceFill(['avatar_path' => $path])->save();
        } catch (\Throwable $e) {
            $this->images->delete($path);
            throw $e;
        }
        $this->deleteOld($old);

        return new UserResource($request->user()->refresh());
    }

    public function destroy(Request $request)
    {
        $old = $request->user()->avatar_path;
        $request->user()->forceFill(['avatar_path' => null])->save();
        $this->deleteOld($old);

        return new UserResource($request->user()->refresh());
    }

    private function deleteOld(?string $path): void
    {
        try {
            $this->images->delete($path);
        } catch (\Throwable $e) {
            Log::warning('Avatar cleanup failed', ['path' => $path]);
        }
    }
}
