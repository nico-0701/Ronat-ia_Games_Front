// Gerado por scripts/gen-api.mjs a partir de openapi/v1.json. Não edite à mão: rode `npm run api:types`.

export interface paths {
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LoginRequest"];
                    "application/json": components["schemas"]["LoginRequest"];
                    "text/json": components["schemas"]["LoginRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RefreshRequest"];
                    "application/json": components["schemas"]["RefreshRequest"];
                    "text/json": components["schemas"]["RefreshRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["RegisterRequest"];
                    "application/json": components["schemas"]["RegisterRequest"];
                    "text/json": components["schemas"]["RegisterRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SessionDto"][];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/avatars/{avatarId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    avatarId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "image/webp": string;
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/avatars/presets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AvatarPresetsDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameDto"][];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{gameId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    gameId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupSummaryDto"][];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateGroupRequest"];
                    "application/json": components["schemas"]["CreateGroupRequest"];
                    "text/json": components["schemas"]["CreateGroupRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["DeleteGroupRequest"];
                    "application/json": components["schemas"]["DeleteGroupRequest"];
                    "text/json": components["schemas"]["DeleteGroupRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateGroupRequest"];
                    "application/json": components["schemas"]["UpdateGroupRequest"];
                    "text/json": components["schemas"]["UpdateGroupRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/groups/{groupId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    before?: string;
                    gameId?: string;
                    limit?: number;
                };
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoryPageDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/invite-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["AddProfileRequest"];
                    "application/json": components["schemas"]["AddProfileRequest"];
                    "text/json": components["schemas"]["AddProfileRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MemberDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/members/{memberId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateMemberRequest"];
                    "application/json": components["schemas"]["UpdateMemberRequest"];
                    "text/json": components["schemas"]["UpdateMemberRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MemberDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/groups/{groupId}/members/{memberId}/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        file?: components["schemas"]["IFormFile"];
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MemberDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MemberDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/members/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/ranking": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    gameId?: string;
                    period?: components["schemas"]["RankingPeriod"];
                };
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RankingDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                };
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionSummaryDto"][];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/{groupId}/transfer-ownership": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    groupId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["TransferOwnershipRequest"];
                    "application/json": components["schemas"]["TransferOwnershipRequest"];
                    "text/json": components["schemas"]["TransferOwnershipRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["JoinGroupRequest"];
                    "application/json": components["schemas"]["JoinGroupRequest"];
                    "text/json": components["schemas"]["JoinGroupRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupDetailDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/groups/lookup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["LookupGroupRequest"];
                    "application/json": components["schemas"]["LookupGroupRequest"];
                    "text/json": components["schemas"]["LookupGroupRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GroupPreviewDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MetaResponse"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["CreateSessionRequest"];
                    "application/json": components["schemas"]["CreateSessionRequest"];
                    "text/json": components["schemas"]["CreateSessionRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/actions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["GameActionRequest"];
                    "application/json": components["schemas"]["GameActionRequest"];
                    "text/json": components["schemas"]["GameActionRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ActionResponse"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateSessionConfigRequest"];
                    "application/json": components["schemas"]["UpdateSessionConfigRequest"];
                    "text/json": components["schemas"]["UpdateSessionConfigRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    after?: number;
                    limit?: number;
                };
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EventDto"][];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/players": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["AddSessionPlayerRequest"];
                    "application/json": components["schemas"]["AddSessionPlayerRequest"];
                    "text/json": components["schemas"]["AddSessionPlayerRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/players/{playerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    playerId: string;
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/rematch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/teams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["AssignTeamsRequest"];
                    "application/json": components["schemas"]["AssignTeamsRequest"];
                    "text/json": components["schemas"]["AssignTeamsRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/teams/shuffle": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GameSessionDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["DeleteAccountRequest"];
                    "application/json": components["schemas"]["DeleteAccountRequest"];
                    "text/json": components["schemas"]["DeleteAccountRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/*+json": components["schemas"]["UpdateProfileRequest"];
                    "application/json": components["schemas"]["UpdateProfileRequest"];
                    "text/json": components["schemas"]["UpdateProfileRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/users/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        file?: components["schemas"]["IFormFile"];
                    };
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PersonalDataExportDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MyStatsDto"];
                    };
                };
                /** @description Erro. O corpo é um ProblemDetails com `code` (estável), `detail`, `traceId` e, em validações, `errors` por campo. */
                default: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ApiProblem"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ActionResponse: {
            replayed: boolean;
            session: components["schemas"]["GameSessionDto"];
        };
        AddProfileRequest: {
            avatarPreset?: null | string;
            displayName: string;
        };
        AddSessionPlayerRequest: {
            /** Format: uuid */
            memberId: null | string;
        };
        ApiProblem: {
            code: string;
            detail: null | string;
            errors: null | {
                [key: string]: string[];
            };
            instance: null | string;
            /** Format: int32 */
            status: number;
            title: null | string;
            traceId: string;
            type: null | string;
        };
        AssignTeamsRequest: {
            assignments: components["schemas"]["TeamAssignmentRequest"][];
        };
        AuthMeta: {
            captchaRequired: boolean;
            captchaSiteKey: null | string;
            registrationOpen: boolean;
        };
        AuthResponse: {
            accessToken: string;
            /** Format: date-time */
            accessTokenExpiresAt: string;
            isNewUser: boolean;
            refreshToken: string;
            /** Format: date-time */
            refreshTokenExpiresAt: string;
            user: components["schemas"]["UserDto"];
        };
        AvatarDto: {
            kind: string;
            preset: null | string;
            url: null | string;
        };
        AvatarPresetsDto: {
            default: string;
            keys: string[];
        };
        ClaimableMemberDto: {
            avatar: components["schemas"]["AvatarDto"];
            displayName: string;
            /** Format: uuid */
            id: string;
        };
        CreateGroupRequest: {
            name: string;
        };
        CreateSessionRequest: {
            config?: null | components["schemas"]["JsonElement"];
            gameId: string;
            /** Format: uuid */
            groupId: null | string;
        };
        DeleteAccountRequest: {
            confirmation: string;
        };
        DeleteGroupRequest: {
            confirmation: string;
        };
        EventDto: {
            /** Format: uuid */
            actorPlayerId: null | string;
            /** Format: date-time */
            createdAt: string;
            payload: null | components["schemas"]["JsonElement"];
            /** Format: int32 */
            seq: number;
            type: string;
        };
        ExportedLoginDto: {
            /** Format: date-time */
            createdAt: string;
            deviceLabel: null | string;
            /** Format: date-time */
            expiresAt: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            lastUsedAt: string;
            /** Format: date-time */
            revokedAt: null | string;
            revokedReason: null | string;
        };
        ExportedMembershipDto: {
            /** Format: uuid */
            groupId: string;
            groupName: string;
            /** Format: date-time */
            joinedAt: string;
            /** Format: date-time */
            leftAt: null | string;
            /** Format: uuid */
            memberId: string;
            role: components["schemas"]["GroupRole"];
            status: components["schemas"]["MemberStatus"];
        };
        ExportedProfileDto: {
            avatar: components["schemas"]["AvatarDto"];
            /** Format: date-time */
            createdAt: string;
            displayName: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            lastLoginAt: null | string;
            phoneLast4: string;
            /** Format: date-time */
            termsAcceptedAt: null | string;
            termsVersion: null | string;
        };
        ExportedResultDto: {
            /** Format: date-time */
            finishedAt: string;
            gameId: string;
            /** Format: uuid */
            groupId: string;
            isWinner: boolean;
            /** Format: int32 */
            rank: number;
            /** Format: int32 */
            score: number;
            /** Format: uuid */
            sessionId: string;
            /** Format: int32 */
            team: null | number;
        };
        GameActionRequest: {
            /** Format: uuid */
            clientActionId: null | string;
            payload?: null | components["schemas"]["JsonElement"];
            type: string;
        };
        GameDto: {
            configDefaults: components["schemas"]["JsonElement"];
            description: string;
            id: string;
            /** Format: int32 */
            maxPlayers: number;
            /** Format: int32 */
            minPlayers: number;
            /** Format: int32 */
            minPlayersPerTeam: number;
            name: string;
            /** Format: int32 */
            rulesVersion: number;
            /** Format: int32 */
            teamCount: number;
        };
        GameSessionDto: {
            allowedActions: string[];
            canManage: boolean;
            config: components["schemas"]["JsonElement"];
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            deadlineAt: null | string;
            /** Format: date-time */
            finishedAt: null | string;
            gameId: string;
            /** Format: uuid */
            groupId: string;
            /** Format: uuid */
            hostMemberId: string;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            myMemberId: string;
            /** Format: uuid */
            myPlayerId: null | string;
            players: components["schemas"]["SessionPlayerDto"][];
            /** Format: int32 */
            rulesVersion: number;
            standings: components["schemas"]["StandingDto"][];
            /** Format: date-time */
            startedAt: null | string;
            status: components["schemas"]["SessionStatus"];
            teamScores: components["schemas"]["TeamScoreDto"][];
            /** Format: int32 */
            version: number;
            view: null | components["schemas"]["JsonElement"];
        };
        GameSessionSummaryDto: {
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            finishedAt: null | string;
            gameId: string;
            /** Format: uuid */
            hostMemberId: string;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            playerCount: number;
            /** Format: date-time */
            startedAt: null | string;
            status: components["schemas"]["SessionStatus"];
        };
        GameStatsDto: {
            gameId: string;
            /** Format: int32 */
            played: number;
            /** Format: int32 */
            score: number;
            /** Format: int32 */
            wins: number;
        };
        GroupDetailDto: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            inviteCode: null | string;
            inviteEnabled: boolean;
            members: components["schemas"]["MemberDto"][];
            /** Format: uuid */
            myMemberId: string;
            myRole: components["schemas"]["GroupRole"];
            name: string;
        };
        GroupPreviewDto: {
            alreadyMember: boolean;
            claimableMembers: components["schemas"]["ClaimableMemberDto"][];
            /** Format: int32 */
            memberCount: number;
            name: string;
        };
        /** @enum {unknown} */
        GroupRole: "member" | "admin" | "owner";
        GroupSummaryDto: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            memberCount: number;
            myRole: components["schemas"]["GroupRole"];
            name: string;
        };
        HistoryEntryDto: {
            /** Format: date-time */
            finishedAt: string;
            gameId: string;
            /** Format: uuid */
            sessionId: string;
            standings: components["schemas"]["HistoryStandingDto"][];
            /** Format: date-time */
            startedAt: null | string;
        };
        HistoryPageDto: {
            items: components["schemas"]["HistoryEntryDto"][];
            /** Format: date-time */
            nextBefore: null | string;
        };
        HistoryStandingDto: {
            avatar: components["schemas"]["AvatarDto"];
            displayName: string;
            isWinner: boolean;
            /** Format: uuid */
            memberId: string;
            /** Format: int32 */
            rank: number;
            /** Format: int32 */
            score: number;
            /** Format: int32 */
            team: null | number;
        };
        /** Format: binary */
        IFormFile: string;
        JoinGroupRequest: {
            /** Format: uuid */
            claimMemberId?: null | string;
            code: string;
        };
        JsonElement: unknown;
        LoginRequest: {
            captchaToken?: null | string;
            deviceName?: null | string;
            phone: string;
        };
        LookupGroupRequest: {
            code: string;
        };
        MemberDto: {
            avatar: components["schemas"]["AvatarDto"];
            displayName: string;
            hasAccount: boolean;
            /** Format: uuid */
            id: string;
            isMe: boolean;
            /** Format: date-time */
            joinedAt: string;
            role: components["schemas"]["GroupRole"];
        };
        /** @enum {unknown} */
        MemberStatus: "active" | "left" | "removed";
        MetaResponse: {
            apiVersion: string;
            auth: components["schemas"]["AuthMeta"];
            minClientVersion: string;
            /** Format: date-time */
            serverTimeUtc: string;
        };
        MyStatsDto: {
            byGame: components["schemas"]["GameStatsDto"][];
            /** Format: int32 */
            groups: number;
            /** Format: int32 */
            played: number;
            /** Format: int32 */
            wins: number;
        };
        PersonalDataExportDto: {
            /** Format: date-time */
            exportedAt: string;
            logins: components["schemas"]["ExportedLoginDto"][];
            memberships: components["schemas"]["ExportedMembershipDto"][];
            profile: components["schemas"]["ExportedProfileDto"];
            results: components["schemas"]["ExportedResultDto"][];
        };
        RankingDto: {
            entries: components["schemas"]["RankingEntryDto"][];
            gameId: null | string;
            period: components["schemas"]["RankingPeriod"];
            /** Format: date-time */
            since: null | string;
        };
        RankingEntryDto: {
            avatar: components["schemas"]["AvatarDto"];
            displayName: string;
            hasAccount: boolean;
            isMe: boolean;
            /** Format: uuid */
            memberId: string;
            /** Format: int32 */
            played: number;
            /** Format: int32 */
            rank: number;
            /** Format: int32 */
            score: number;
            /** Format: double */
            winRate: number;
            /** Format: int32 */
            wins: number;
        };
        /** @enum {unknown} */
        RankingPeriod: "all" | "year" | "quarter" | "month" | "week";
        RefreshRequest: {
            deviceName?: null | string;
            refreshToken: string;
        };
        RegisterRequest: {
            acceptTerms?: boolean;
            avatarPreset?: null | string;
            captchaToken?: null | string;
            deviceName?: null | string;
            displayName: string;
            phone: string;
        };
        SessionDto: {
            /** Format: date-time */
            createdAt: string;
            deviceLabel: null | string;
            /** Format: uuid */
            id: string;
            isCurrent: boolean;
            /** Format: date-time */
            lastUsedAt: string;
        };
        SessionPlayerDto: {
            avatar: components["schemas"]["AvatarDto"];
            displayName: string;
            hasAccount: boolean;
            /** Format: uuid */
            id: string;
            isMe: boolean;
            /** Format: uuid */
            memberId: string;
            /** Format: int32 */
            score: number;
            /** Format: int32 */
            seat: number;
            /** Format: int32 */
            team: null | number;
        };
        /** @enum {unknown} */
        SessionStatus: "waiting" | "inProgress" | "finished" | "cancelled";
        StandingDto: {
            displayName: string;
            isWinner: boolean;
            /** Format: uuid */
            memberId: string;
            /** Format: uuid */
            playerId: string;
            /** Format: int32 */
            rank: number;
            /** Format: int32 */
            score: number;
            /** Format: int32 */
            team: null | number;
        };
        TeamAssignmentRequest: {
            /** Format: uuid */
            playerId: null | string;
            /** Format: int32 */
            team?: null | number;
        };
        TeamScoreDto: {
            /** Format: int32 */
            score: number;
            /** Format: int32 */
            team: number;
        };
        TransferOwnershipRequest: {
            /** Format: uuid */
            memberId: null | string;
        };
        UpdateGroupRequest: {
            inviteEnabled?: null | boolean;
            name?: null | string;
        };
        UpdateMemberRequest: {
            avatarPreset?: null | string;
            displayName?: null | string;
            role?: null | components["schemas"]["GroupRole"];
        };
        UpdateProfileRequest: {
            avatarPreset?: null | string;
            displayName?: null | string;
        };
        UpdateSessionConfigRequest: {
            config: null | components["schemas"]["JsonElement"];
        };
        UserDto: {
            avatar: components["schemas"]["AvatarDto"];
            /** Format: date-time */
            createdAt: string;
            displayName: string;
            /** Format: uuid */
            id: string;
            phoneLast4: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
