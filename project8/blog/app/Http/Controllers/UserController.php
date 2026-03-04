<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}
    public function index()
    {
        $this->authorize('viewAny', User::class);
        $users = User::with('posts')->paginate(15);
        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);
        return new UserResource($user->load('posts.tags'));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $validated = $request->validated();
        $updatedUser = $this->userService->updateBio(
            $user,
            $validated['user_bio']
        );
        return (new UserResource($updatedUser))->response();
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);
        $this->userService->delete($user);
        return response()->json(['message' => 'User deleted successfully'], 204);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $validated = $request->validated();

        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'user_bio' => $validated['user_bio'] ?? null,
        ]);

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
